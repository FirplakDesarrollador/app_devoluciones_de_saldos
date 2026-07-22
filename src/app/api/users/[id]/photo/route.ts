import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      return new NextResponse('Missing Azure AD credentials', { status: 500 });
    }

    // Get Access Token
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
      return new NextResponse('Failed to authenticate with Azure AD', { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch User Profile Picture
    const photoResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${id}/photo/$value`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!photoResponse.ok) {
      // If the user has no photo, graph returns 404
      if (photoResponse.status === 404) {
        return new NextResponse('No photo found', { status: 404 });
      }
      return new NextResponse('Failed to fetch photo from Microsoft Graph', { status: 500 });
    }

    const buffer = await photoResponse.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': photoResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // cache for 1 day
      },
    });
  } catch (error) {
    console.error('API /users/[id]/photo error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
