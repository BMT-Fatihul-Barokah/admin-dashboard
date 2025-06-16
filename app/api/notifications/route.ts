import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST handler for creating a new notification
export async function POST(request: Request) {
  try {
    // Check if Supabase client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: database client not available.' },
        { status: 500 }
      );
    }

    // Parse request body
    const { judul, pesan, jenis } = await request.json();

    // Validate required fields
    if (!judul || !pesan || !jenis) {
      return NextResponse.json(
        { error: 'Missing required fields: judul, pesan, and jenis are required.' },
        { status: 400 }
      );
    }

    // Insert notification into global_notifikasi table
    const { data, error } = await supabaseAdmin
      .from('global_notifikasi')
      .insert([
        {
          judul,
          pesan,
          jenis,
          data: {}, // Empty JSON object for data field
        },
      ])
      .select();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: `Failed to create notification: ${error.message}` },
        { status: 500 }
      );
    }

    // Get the newly created notification ID
    const notificationId = data?.[0]?.id;
    
    if (!notificationId) {
      console.error('Failed to get notification ID from created notification');
      return NextResponse.json(
        { error: 'Failed to get notification ID from created notification' },
        { status: 500 }
      );
    }

    // Fetch all anggota IDs
    const { data: anggotaData, error: anggotaError } = await supabaseAdmin
      .from('anggota')
      .select('id')
      .eq('is_active', true);

    if (anggotaError) {
      console.error('Error fetching anggota IDs:', anggotaError);
      return NextResponse.json(
        { 
          error: `Failed to fetch anggota IDs: ${anggotaError.message}`,
          notificationCreated: true,
          notificationReadEntriesFailed: true 
        },
        { status: 500 }
      );
    }

    // Create read status entries for all anggota
    if (anggotaData && anggotaData.length > 0) {
      const readEntries = anggotaData.map(anggota => ({
        global_notifikasi_id: notificationId,
        anggota_id: anggota.id,
        is_read: false
      }));

      const { error: readError } = await supabaseAdmin
        .from('global_notifikasi_read')
        .insert(readEntries);

      if (readError) {
        console.error('Error creating notification read entries:', readError);
        return NextResponse.json(
          { 
            error: `Failed to create notification read entries: ${readError.message}`,
            notificationCreated: true,
            notificationReadEntriesFailed: true 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Notification created successfully and read entries created for all anggota', 
        data 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Unexpected error in notification creation:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET handler for retrieving notifications
export async function GET() {
  try {
    // Check if Supabase client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: database client not available.' },
        { status: 500 }
      );
    }

    // Fetch notifications from global_notifikasi table
    const { data, error } = await supabaseAdmin
      .from('global_notifikasi')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: `Failed to fetch notifications: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unexpected error in notification retrieval:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
