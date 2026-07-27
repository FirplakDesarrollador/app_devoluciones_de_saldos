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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { accion, razon } = body as { accion: 'aprobar' | 'rechazar'; razon?: string };

    if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    if (accion === 'rechazar' && (!razon || razon.trim() === '')) {
      return NextResponse.json({ error: 'La razón de rechazo es obligatoria' }, { status: 400 });
    }

    const token = await getGraphToken();

    // 1. Fetch current item fields
    const itemRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${id}?$expand=fields`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );

    if (!itemRes.ok) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    // 2. Build fields to update
    const nowIso = new Date().toISOString();
    const estado = accion === 'aprobar' ? 'Aprovado' : 'Rechazado';

    const updatedFields: Record<string, string> = {
      Estado: estado,
      FechaDecision: nowIso,
    };

    if (accion === 'rechazar' && razon) {
      updatedFields.MotivoRechazo = razon.trim();
    }

    // 3. PATCH the SharePoint item with decision fields
    const patchRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${id}/fields`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('SharePoint PATCH error:', errText);
      return NextResponse.json({ error: 'Error al actualizar el estado en SharePoint' }, { status: 500 });
    }

    console.log(`Solicitud ${id} ${estado.toUpperCase()} en SharePoint`);

    return NextResponse.json({ success: true, accion, estado });
  } catch (error) {
    console.error('Error en /api/aprobacion/[id]/action:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
