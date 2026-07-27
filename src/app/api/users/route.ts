import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Azure AD credentials' }, { status: 500 });
    }

    // 1. Get Access Token
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', clientId);
    tokenParams.append('scope', 'https://graph.microsoft.com/.default');
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('grant_type', 'client_credentials');

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Error fetching token:', errorData);
      return NextResponse.json({ error: 'Failed to authenticate with Azure AD' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Users
    const usersResponse = await fetch(
      'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail&$top=500',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!usersResponse.ok) {
      const errorData = await usersResponse.text();
      console.error('Error fetching users:', errorData);
      return NextResponse.json({ error: 'Failed to fetch users from Microsoft Graph' }, { status: 500 });
    }

    const usersData = await usersResponse.json();
    
    const searchParams = request.nextUrl.searchParams;
    const fetchAll = searchParams.get('all') === 'true';

    // Map and filter users to only include Andres Naranjo and Ider (unless fetchAll is true)
    const approvers = usersData.value
      .filter((u: any) => {
        if (!u.displayName) return false;
        
        if (fetchAll) return true; // Mostrar todo el tenant si all=true

        const name = u.displayName.toLowerCase();
        const email = (u.mail || '').toLowerCase();
        return name.includes('andres naranjo') || 
               name.includes('andrés naranjo') || 
               name.includes('ider') ||
               name.includes('esteban muñoz') ||
               name.includes('esteban munoz') ||
               email.includes('analista2.desarrollo');
      })
      .map((u: any) => ({
        id: u.id,
        name: u.displayName,
        email: u.mail || ''
      }));

    return NextResponse.json(approvers);
  } catch (error) {
    console.error('API /users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
