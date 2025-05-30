import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Replace this path with the actual path where you store the APK file on your server
    const apkPath = path.join(process.cwd(), 'public', 'app.apk');
    
    // Read the APK file
    const apkFile = fs.readFileSync(apkPath);
    
    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.android.package-archive');
    headers.set('Content-Disposition', 'attachment; filename="app.apk"');
    headers.set('Content-Length', apkFile.length.toString());
    
    return new NextResponse(apkFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading APK:', error);
    return new NextResponse('Error downloading APK file', { status: 500 });
  }
}
