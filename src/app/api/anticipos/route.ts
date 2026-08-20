import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const { 
      titulo, 
      concepto, 
      valor, 
      tipo, 
      observaciones,
      solicitanteId,
      solicitanteNombre,
      solicitanteEmail,
      aprobadorId,
      aprobadorNombre,
      aprobadorEmail
    } = data;

    // Convert valor to number
    const valorNum = parseFloat(String(valor)?.replace(/[^0-9.-]+/g,"")) || 0;

    // 1. Authenticate with Graph API
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      console.error('Faltan credenciales de Azure en las variables de entorno.');
      return NextResponse.json({ success: false, error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', clientId);
    tokenParams.append('scope', 'https://graph.microsoft.com/.default');
    tokenParams.append('client_secret', clientSecret);
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

    // 2. Resolve SharePoint User IDs (Optional but recommended for Person/Group fields)
    let spAprobadorId = null;
    let spSolicitanteId = null;

    const resolveUser = async (email: string) => {
      if (!email) return null;
      try {
        const userQueryRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/User Information List/items?$expand=fields&$filter=fields/EMail eq '${email}'`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'
          }
        });
        if (userQueryRes.ok) {
          const userData = await userQueryRes.json();
          if (userData.value && userData.value.length > 0) {
            return parseInt(userData.value[0].id, 10);
          }
        }
      } catch (err) {
        console.error('Failed to resolve user ID dynamically', err);
      }
      return null;
    };

    spAprobadorId = await resolveUser(aprobadorEmail);
    spSolicitanteId = await resolveUser(solicitanteEmail);

    // Prepare Observaciones with fallback
    let finalObservaciones = observaciones || '';
    finalObservaciones += `\n\n---\nDetalles guardados desde la aplicación:`;
    finalObservaciones += `\nTipo de anticipo (URL): ${tipo}`;
    if (!spSolicitanteId) finalObservaciones += `\nSolicitante: ${solicitanteNombre} (${solicitanteEmail})`;
    if (!spAprobadorId) finalObservaciones += `\nAprobador: ${aprobadorNombre} (${aprobadorEmail})`;

    // 3. Find the List ID for "anticipos"
    const listsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!listsRes.ok) {
      throw new Error('Failed to fetch SharePoint lists');
    }

    const listsData = await listsRes.json();
    const anticiposList = listsData.value.find((l: any) => l.displayName.toLowerCase() === 'anticipos');

    if (!anticiposList) {
      console.error('No se encontró la lista "anticipos" en SharePoint.');
      return NextResponse.json({ error: 'La lista anticipos no existe en SharePoint' }, { status: 404 });
    }

    const listId = anticiposList.id;

    const spData = {
      fields: {
        Title: titulo || 'Sin Título',
        Concepto: concepto || 'Sin Concepto',
        Valor: valorNum,
        Observaciones: finalObservaciones
      } as Record<string, any>
    };
    
    // Si viene proveedor, lo agregamos (asumiendo que los nombres de columna en SharePoint son NITProveedor y Nombreproveedor)
    if (data.nitProveedor) {
      spData.fields.NITProveedor = data.nitProveedor;
    }
    if (data.nombreProveedor) {
      spData.fields.Nombreproveedor = data.nombreProveedor;
    }
    
    if (spAprobadorId) {
      spData.fields.AprobadorLookupId = spAprobadorId;
    }
    
    // Guardar el solicitante (creador) en la nueva columna
    if (spSolicitanteId) {
      // Asumimos que la columna tipo Persona se llama "Creadopor" (internamente)
      spData.fields.CreadoporLookupId = spSolicitanteId;
    }

    console.log('Sending to SharePoint (Anticipos):', JSON.stringify(spData, null, 2));

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
      console.error('SharePoint error (Anticipos):', errText);
      return NextResponse.json({ error: 'Failed to create item in SharePoint', details: errText }, { status: 400 });
    }
    
    const spResult = await spRes.json();
    const itemId = spResult.id;

    return NextResponse.json({ success: true, id: itemId });

  } catch (error: any) {
    console.error('Submit Error (Anticipos):', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
