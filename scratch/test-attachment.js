const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

async function main() {
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
  const { access_token } = await tokenRes.json();

  const siteId = 'firplaksa.sharepoint.com,61567c23-79a5-4438-a377-2f240de3c001,cbab86be-5337-4c4a-bfa5-29b6803775c3';
  const listId = 'd3031d13-e8b1-4289-9d1b-a905f1495554';
  const itemId = '16'; // Use the itemId from the screenshot

  const attachmentData = {
    "name": "test_attachment.txt",
    "contentType": "text/plain",
    "contentBytes": Buffer.from("hello world").toString("base64")
  };

  const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}/attachmentFiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attachmentData)
  });

  console.log(res.status, await res.text());
}
main();
