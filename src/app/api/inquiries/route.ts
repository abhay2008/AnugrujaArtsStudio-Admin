import { NextRequest, NextResponse } from 'next/server';
import { loadInquiries, saveInquiries } from '@/lib/serverContent';
import { Inquiry } from '@/lib/types';

export async function GET() {
  try {
    const inquiries = loadInquiries();
    return NextResponse.json(inquiries);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed loading inquiries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inquiry } = body as { inquiry: Inquiry };

    if (!inquiry || !inquiry.customerName || !inquiry.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    const inquiries = loadInquiries();
    const existingIndex = inquiries.findIndex((i) => i.id === inquiry.id);

    if (existingIndex >= 0) {
      inquiries[existingIndex] = inquiry;
    } else {
      if (!inquiry.id) {
        inquiry.id = `inq-${Date.now()}`;
      }
      if (!inquiry.date) {
        inquiry.date = new Date().toISOString().split('T')[0];
      }
      inquiries.unshift(inquiry);
    }

    saveInquiries(inquiries);
    return NextResponse.json({ success: true, inquiry, total: inquiries.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed saving inquiry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    const inquiries = loadInquiries();
    const filtered = inquiries.filter((i) => i.id !== id);
    saveInquiries(filtered);

    return NextResponse.json({ success: true, total: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed deleting inquiry' }, { status: 500 });
  }
}
