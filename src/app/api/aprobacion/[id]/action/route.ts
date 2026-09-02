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
    const { accion, razon, valorAutorizado } = body as { 
      accion: 'aprobar' | 'rechazar'; 
      razon?: string;
      valorAutorizado?: number;
    };

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

    const itemData = await itemRes.json();
    const currentObservaciones: string = itemData.fields?.Observaciones || '';

    // 2. Build fields to update
    const timestamp = new Date().toLocaleString('es-CO', {
      dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota',
    });
    const estado = accion === 'aprobar' ? 'Aprobado' : 'Rechazado';

    const decisionText = accion === 'aprobar'
      ? `\n\n✅ APROBADO el ${timestamp}${valorAutorizado !== undefined ? ` por un valor de $${valorAutorizado}` : ''}`
      : `\n\n❌ RECHAZADO el ${timestamp}`;

    const newObservaciones = currentObservaciones + decisionText;

    const updatedFields: Record<string, any> = {
      Estado: estado,
      Observaciones: newObservaciones,
    };

    if (accion === 'aprobar' && valorAutorizado !== undefined) {
      updatedFields.Valor_autorizado = valorAutorizado;
    }

    if (accion === 'rechazar' && razon) {
      updatedFields.observaciones_rechazo = razon.trim();
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

    // 4. Notificar a Power Automate sobre la decisión
    const decisionWebhook = process.env.POWER_AUTOMATE_DECISION_WEBHOOK;
    if (decisionWebhook) {
      try {
        const nombreCliente = itemData.fields?.NombredelCliente || 'Cliente';
        
        // Extraer email del solicitante de las observaciones
        const solicitanteMatch = currentObservaciones.match(/Solicitante: .*?\((.*?)\)/);
        const solicitanteEmail = solicitanteMatch ? solicitanteMatch[1].trim() : nombreCliente;

        let titulo = '';
        let mensaje = '';

        if (accion === 'aprobar') {
          titulo = `Su solicitud, ${nombreCliente} fue aprobada`;
          const valFormat = valorAutorizado ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valorAutorizado) : '';
          mensaje = `Nos complace informarle que su solicitud de devolución de saldo ha sido aprobada exitosamente${valFormat ? ` por un valor autorizado de ${valFormat}` : ''}. El pago será procesado y transferido en el perido de tiempo establecido por el area financiera. Este periodo puede tardar hasta 30 días calendario.`;
        } else {
          titulo = `Su solicitud, ${nombreCliente} fue rechazada`;
          mensaje = `Le informamos que su solicitud de devolución de saldo ha sido rechazada por el siguiente motivo:\n\n"${razon}"\n\nSi tiene alguna duda o requiere mayor información, por favor póngase en contacto con nuestro equipo de cartera.`;
        }

        // Obtener correo de Laura Duque del tenant
        let lauraEmail = 'coordinacionfinanciera@firplak.com'; // fallback
        try {
          const usersRes = await fetch(`https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName, 'Laura Isabel Duque')`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            if (usersData.value && usersData.value.length > 0 && usersData.value[0].mail) {
              lauraEmail = usersData.value[0].mail;
            }
          }
        } catch (err) {
          console.error('Error buscando a Laura Duque en el tenant', err);
        }

        const destinatarios = solicitanteEmail ? `${solicitanteEmail};${lauraEmail}` : lauraEmail;

        const payload = {
          titulo,
          solicitante: destinatarios,
          mensaje,
        };

        console.log('Enviando notificación de decisión a destinatarios:', destinatarios);

        const paRes = await fetch(decisionWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!paRes.ok) {
          console.error('Error enviando notificación de decisión a Power Automate:', await paRes.text());
        }

        // --- Enviar certificación bancaria si fue aprobado ---
        if (accion === 'aprobar') {
          const certificadoWebhook = process.env.POWER_AUTOMATE_CERTIFICADO_WEBHOOK || 'https://8c18912a4169ec67aa9b39bdfb7cc3.10.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/00/workflows/c159bf38d23f4ca7bf38dfece31fc064/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=m85rJk83hYTrBICvjA4Mt6eScBIVh1z_PAqo651q5wk';
          if (certificadoWebhook) {
            console.log('[Certificación] Buscando URL en observaciones:\n', currentObservaciones);
            const certMatch = currentObservaciones.match(/certificaci[oó]n:\s*(https?:\/\/\S+)/i);
            const certUrl = certMatch ? certMatch[1].trim() : null;
            console.log('[Certificación] URL encontrada:', certUrl);

            if (certUrl) {
              const ext = certUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf';
              const nombreArchivo = `certificacion_bancaria.${ext}`;
              const valFormat = valorAutorizado 
                ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valorAutorizado) 
                : '';

              const payloadCertificado = {
                titulo: nombreCliente || 'Cliente',
                contenido: `Se adjunta la certificación bancaria de ${nombreCliente || 'Cliente'}.${valFormat ? ` Valor autorizado: ${valFormat}` : ''}`,
                nombreArchivo: nombreArchivo,
                archivoUrl: certUrl,
              };

              console.log('[Certificación] Enviando payload a Power Automate:', JSON.stringify(payloadCertificado, null, 2));
              const paCertRes = await fetch(certificadoWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadCertificado)
              });

              if (!paCertRes.ok) {
                console.error('[Certificación] Error enviando a Power Automate:', paCertRes.status, await paCertRes.text());
              } else {
                console.log('[Certificación] Certificación enviada correctamente a Power Automate.');
              }
            } else {
              console.warn('[Certificación] No se encontró la URL de certificación en las observaciones.');
            }
          }
        }
        // --- Fin certificación bancaria ---

      } catch (e) {
        console.error('Error al notificar decisión:', e);
      }
    }

    return NextResponse.json({ success: true, accion, estado });
  } catch (error) {
    console.error('Error en /api/aprobacion/[id]/action:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
