import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Faltan credenciales de Supabase');
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('proveedores')
      .select('id, numero_identificacion, razon_social, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, tipo_contraparte')
      .eq('estado', 'aprobado'); // Generalmente solo queremos proveedores aprobados

    if (search) {
      // Usamos .or() para buscar en múltiples columnas
      query = query.or(`razon_social.ilike.%${search}%,numero_identificacion.ilike.%${search}%,primer_nombre.ilike.%${search}%,primer_apellido.ilike.%${search}%`);
    }

    // Limitamos los resultados para rendimiento
    const { data, error } = await query.limit(30);

    if (error) {
      throw error;
    }

    // Mapeamos a un formato simplificado para el frontend
    const proveedores = data.map(p => {
      let nombre = '';
      if (p.tipo_contraparte === 'persona_juridica' && p.razon_social) {
        nombre = p.razon_social;
      } else {
        nombre = [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' ');
      }
      
      // Fallback
      if (!nombre.trim() && p.razon_social) {
        nombre = p.razon_social;
      }

      return {
        id: p.id,
        nit: p.numero_identificacion,
        nombre: nombre.trim()
      };
    });

    return NextResponse.json(proveedores);

  } catch (error) {
    console.error('Error fetching proveedores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
