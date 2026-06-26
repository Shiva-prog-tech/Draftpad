import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/server/db/connect';
import { UserModel } from '@/server/db/models';
import { RegisterSchema } from '@/server/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    await connectDB();
    const existing = await UserModel.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const hashed = await bcrypt.hash(parsed.data.password, 12);
    const user = await UserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
    });
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
