async function main() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const tokenParams = new URLSearchParams();
  tokenParams.append('client_id', clientId);
  tokenParams.append('scope', 'https://firplaksa.sharepoint.com/.default');
  tokenParams.append('client_secret', clientSecret);
  tokenParams.append('grant_type', 'client_credentials');

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    console.error('No token', tokenData);
    return;
  }

  // Attempt to hit SP REST API
  const spRes = await fetch(`https://firplaksa.sharepoint.com/sites/FPKContabilidad/_api/web/lists/getbytitle('Devolucion de Saldos')/items(7)?$select=Id,Title`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json;odata=nometadata'
    }
  });

  const text = await spRes.text();
  console.log('Status:', spRes.status);
  console.log('Response:', text);
}

main().catch(console.error);
