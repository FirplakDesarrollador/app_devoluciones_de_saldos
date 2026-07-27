import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'devoluciones';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const nombreCliente = formData.get('nombreCliente') as string;
    const nitCliente = formData.get('nitCliente') as string;
    const valorStr = formData.get('valor') as string;
    const aprobadorId = formData.get('aprobador') as string;
    const aprobadorEmail = formData.get('aprobadorEmail') as string;
    const aprobadorNombre = formData.get('aprobadorNombre') as string;
    const observacionesForm = formData.get('observaciones') as string || '';
    const empresa = formData.get('empresa') as string || '';
    
    // Convert valor to number, handling string commas/dots if necessary
    const valor = parseFloat(valorStr?.replace(/[^0-9.-]+/g,"")) || 0;

    // Files
    const files = {
      cedula: formData.get('archivo_cedula') as File | null,
      certificacion: formData.get('archivo_certificacion') as File | null,
      soporte: formData.get('archivo_soporte') as File | null,
      carta: formData.get('archivo_carta') as File | null,
    };

    // 1. Upload files to Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ensure bucket exists (or ignore if it does)
    await supabase.storage.createBucket(BUCKET_NAME, { public: true }).catch(() => {});

    const fileUrls: { tipo: string, url: string, nombre: string, mime: string, base64: string }[] = [];
    
    for (const [key, file] of Object.entries(files)) {
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${nitCliente}_${key}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'application/octet-stream';
        
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false
          });
          
        if (error) {
          console.error(`Failed to upload ${key}:`, error);
        } else {
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          fileUrls.push({
            tipo: key,
            url: data.publicUrl,
            nombre: `${key}.${fileExt}`,
            mime: mimeType,
            base64: buffer.toString('base64')
          });
        }
      }
    }

    // 3. Authenticate with Graph API
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', clientId!);
    tokenParams.append('scope', 'https://graph.microsoft.com/.default');
    tokenParams.append('client_secret', clientSecret!);
    tokenParams.append('grant_type', 'client_credentials');

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    
    if (!tokenRes.ok) {
      throw new Error('Failed to get Graph token');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const siteId = 'firplaksa.sharepoint.com,61567c23-79a5-4438-a377-2f240de3c001,cbab86be-5337-4c4a-bfa5-29b6803775c3';
    const listId = 'd3031d13-e8b1-4289-9d1b-a905f1495554';

    // Map the specific approvers to their SharePoint User IDs (from User Information List)
    // Ider Alejandro Sandoval Hernandez -> ID 115
    // Andrés Naranjo Orozco -> ID 56
    let spUserId = null;
    const nameLower = (aprobadorNombre || '').toLowerCase();
    const emailLower = (aprobadorEmail || '').toLowerCase();

    if (nameLower.includes('ider') || emailLower.includes('alejandro.sandoval')) {
      spUserId = 115;
    } else if (nameLower.includes('andres naranjo') || nameLower.includes('andrés naranjo') || emailLower.includes('cartera2')) {
      spUserId = 56;
    }
    // Esteban Muñoz Garcia - se resuelve dinámicamente por email si no tiene ID hardcodeado
    // El bloque de resolución dinámica a continuación lo buscará automáticamente

    // Attempt to resolve dynamically only if it's someone else (though the UI restricts it)
    if (!spUserId && aprobadorEmail) {
      try {
        const userQueryRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/User Information List/items?$expand=fields&$filter=fields/EMail eq '${aprobadorEmail}'`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'
          }
        });
        
        if (userQueryRes.ok) {
          const userData = await userQueryRes.json();
          if (userData.value && userData.value.length > 0) {
            spUserId = parseInt(userData.value[0].id, 10);
          }
        }
      } catch (err) {
        console.error('Failed to resolve user ID dynamically', err);
      }
    }

    // Prepare Observaciones (fallback to appending Aprobador if SP ID not found)
    let finalObservaciones = observacionesForm;
    
    if (!spUserId && aprobadorNombre) {
      finalObservaciones += `\n\nAprobador Seleccionado: ${aprobadorNombre} (${aprobadorEmail})`;
    }
    
    // We still keep the URLs in observaciones as a fallback/record
    if (fileUrls.length > 0) {
      const urlsText = fileUrls.map(f => `${f.tipo}: ${f.url}`).join('\n');
      finalObservaciones += `\n\nDocumentos adjuntos:\n${urlsText}`;
    }

    // 4. Create SharePoint List Item
    const spData = {
      fields: {
        Title: nitCliente || 'Sin NIT', 
        NombredelCliente: nombreCliente || 'Sin Nombre',
        Valor: valor,
        Observaciones: finalObservaciones,
        Compa_x00f1_ia: empresa,
        Estado: 'Pendiente',
      } as Record<string, any>
    };
    
    if (spUserId) {
      spData.fields.AprobadorLookupId = spUserId;
      console.log('Setting AprobadorLookupId to:', spData.fields.AprobadorLookupId);
    } else {
      console.log('spUserId was null or empty, falling back to Observaciones');
    }

    console.log('Sending to SharePoint:', JSON.stringify(spData, null, 2));

    const spRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spData)
    });

    if (!spRes.ok) {
      const errText = await spRes.text();
      console.error('SharePoint error:', errText);
      return NextResponse.json({ error: 'Failed to create item in SharePoint' }, { status: 500 });
    }
    
    const spResult = await spRes.json();
    const itemId = spResult.id;

    // 5. Trigger Power Automate Webhook (If configured) - Send URLs only so PA can download them
    const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK;
    if (webhookUrl && fileUrls.length > 0) {
      try {
        const payload = {
          id_elemento: String(itemId),
          archivos: fileUrls.map(f => ({
            nombre: f.nombre,
            url: f.url,
            base64: f.base64,
            mime: f.mime
          }))
        };
        
        console.log('Sending URL payload to Power Automate...');

        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (webhookRes.ok) {
          console.log('Power Automate Webhook triggered successfully!');
        } else {
          console.error('Power Automate Webhook failed:', await webhookRes.text());
        }
      } catch (webhookErr) {
        console.error('Failed to trigger webhook', webhookErr);
      }
    }


    // 6. Notificar al aprobador via Power Automate
    const notificationWebhook = process.env.POWER_AUTOMATE_NOTIFICATION_WEBHOOK;
    if (notificationWebhook && aprobadorEmail) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const approvalLink = `${appUrl}/aprobacion/${itemId}`;

        const valorFormateado = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(valor);

        const notificationPayload = {
          titulo: `Solicitud de Devolución de Saldo – ${nombreCliente}`,
          mensaje: `Se ha creado una nueva solicitud de devolución de saldo para el cliente ${nombreCliente} (NIT: ${nitCliente}) por valor de ${valorFormateado}. Por favor revise y apruebe la solicitud haciendo clic en el enlace.`,
          responsable: aprobadorEmail,
          link: approvalLink,
        };

        console.log('Enviando notificación al aprobador:', aprobadorEmail);

        const notifRes = await fetch(notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationPayload),
        });

        if (notifRes.ok) {
          console.log('Notificación enviada exitosamente al aprobador:', aprobadorEmail);
        } else {
          console.error('Error enviando notificación:', await notifRes.text());
        }
      } catch (notifErr) {
        console.error('Error en notificación al aprobador:', notifErr);
      }
    }

    return NextResponse.json({ success: true, id: itemId });

  } catch (error) {
    console.error('Submit Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
