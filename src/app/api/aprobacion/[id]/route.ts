import { NextResponse } from 'next/server';

const siteId = 'firplaksa.sharepoint.com,61567c23-79a5-4438-a377-2f240de3c001,cbab86be-5337-4c4a-bfa5-29b6803775c3';
const listId = 'd3031d13-e8b1-4289-9d1b-a905f1495554';

async function getGraphToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const params = new URLSearchParams({
    client_id: clientId!,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: clientSecret!,
    grant_type: 'client_credentials',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  const data = await res.json();
  return data.access_token as string;
}

function parseAttachments(observaciones: string) {
  const attachments: Array<{ tipo: string; url: string }> = [];
  if (!observaciones) return attachments;

  const sectionMatch = observaciones.match(/Documentos adjuntos:\n([\s\S]*?)(\n\n|$)/);
  if (!sectionMatch) return attachments;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(': ');
    if (colonIdx > -1) {
      const tipo = line.substring(0, colonIdx).trim();
      const url = line.substring(colonIdx + 2).trim();
      if (url.startsWith('http')) {
        attachments.push({ tipo, url });
      }
    }
  }
  return attachments;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getGraphToken();

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${id}?$expand=fields`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Graph API error:', err);
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const data = await res.json();
    const fields = data.fields;

    const observacionesRaw: string = fields.Observaciones || '';
    
    // Parse decision from appended text
    const decisionMatch = observacionesRaw.match(/(?:✅ APROBADO|❌ RECHAZADO) el (.*?)(?:\nMotivo: ([\s\S]*))?$/);
    const parsedFecha = decisionMatch ? decisionMatch[1].trim() : null;
    const parsedMotivo = decisionMatch && decisionMatch[2] ? decisionMatch[2].trim() : '';

    // Strip attachment URLs and decision sections to show clean observaciones
    const observacionesClean = observacionesRaw
      .replace(/\n\n(?:✅ APROBADO|❌ RECHAZADO) el [\s\S]*$/, '')
      .replace(/\n\nDocumentos adjuntos:[\s\S]*$/, '')
      .replace(/\n\nAprobador Seleccionado:[\s\S]*$/, '')
      .replace(/\n\nSolicitante: .*?\([^)]+\)/g, '')
      .trim();

    const attachments = parseAttachments(observacionesRaw);

    return NextResponse.json({
      id,
      nit: fields.Title || '',
      nombreCliente: fields.NombredelCliente || '',
      valor: fields.Valor || 0,
      valorAutorizado: fields.Valor_autorizado,
      empresa: fields.Compa_x00f1_ia || '',
      observaciones: observacionesClean,
      estado: fields.Estado || 'pendiente',
      fechaDecision: parsedFecha,
      motivoRechazo: parsedMotivo,
      attachments,
      createdAt: data.createdDateTime,
      modifiedAt: data.lastModifiedDateTime,
    });
  } catch (error) {
    console.error('Error en /api/aprobacion/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
