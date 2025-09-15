import { NextResponse } from 'next/server';
import cloudinary from '../../../../lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'restaurants', // Optional: organize uploads in folders
          transformation: [
            { width: 800, height: 600, crop: 'fill' }, // Resize and crop
            { quality: 'auto' }, // Optimize quality
            { fetch_format: 'auto' } // Optimize format
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      message: 'Upload successful',
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Upload failed', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE method to remove images from Cloudinary
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { message: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const deleteResponse = await cloudinary.uploader.destroy(publicId);

    if (deleteResponse.result === 'ok') {
      return NextResponse.json({
        message: 'Image deleted successfully'
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to delete image' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { message: 'Delete failed', error: error.message },
      { status: 500 }
    );
  }
}
