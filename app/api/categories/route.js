import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';

export async function GET() {
  try {
    await connectDB();
    
    // Get unique categories from existing menu items
    const categories = await MenuItem.distinct('category');
    
    // Sort alphabetically and filter out empty values
    const sortedCategories = categories
      .filter(cat => cat && cat.trim())
      .sort()
      .map(category => ({
        name: category,
        slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }));
    
    return NextResponse.json({
      success: true,
      categories: sortedCategories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
