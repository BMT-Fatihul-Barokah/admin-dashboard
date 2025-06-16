import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import path from 'path';
import { importTransactions } from '../../../scripts/import_transactions';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'File must be an Excel (.xlsx) file' },
        { status: 400 }
      );
    }

    // Create a buffer from the file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const filename = `transaksi-${dateStr}.xlsx`;
    
    // Save the file to the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    try {
      // Ensure the uploads directory exists
      await writeFile(filePath, buffer);
      console.log(`File saved to ${filePath}`);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json(
        { error: 'Error saving file' },
        { status: 500 }
      );
    }

    // Process the Excel file
    const result = await importTransactions(filePath);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${result.count} transactions`,
        count: result.count
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Error importing transactions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
