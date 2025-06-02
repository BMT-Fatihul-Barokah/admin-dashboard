import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only Supabase client with service role key
const supabaseUrl = 'https://vszhxeamcxgqtwyaxhlu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzemh4ZWFtY3hncXR3eWF4aGx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODg0NDQ4NiwiZXhwIjoyMDY0NDIwNDg2fQ.FkK4YRjPQ0BczBelUVPCe5vEvvWEH5xtBxWVcnKGSSI';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Extract required data from request
    const { tabungan_id, newBalance, operation } = body;

    if (!tabungan_id || newBalance === undefined || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields: tabungan_id, newBalance, or operation' },
        { status: 400 }
      );
    }

    console.log(`Processing ${operation} for tabungan_id: ${tabungan_id}, setting balance to: ${newBalance}`);

    // Update the tabungan balance using admin client (server-side only)
    const { data, error } = await supabaseAdmin
      .from('tabungan')
      .update({ 
        saldo: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', tabungan_id)
      .select();

    if (error) {
      console.error('Error updating tabungan balance:', error);
      return NextResponse.json(
        { error: `Failed to update balance: ${error.message}` },
        { status: 500 }
      );
    }

    // Return success response with the updated data
    return NextResponse.json({
      success: true,
      message: `${operation} processed successfully`,
      data: data
    });
  } catch (error: any) {
    console.error('Server error processing transaction:', error);
    return NextResponse.json(
      { error: `Server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
