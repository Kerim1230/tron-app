import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const skills = await db.skill.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المهارات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, steps, icon } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'الاسم والوصف مطلوبان' },
        { status: 400 }
      );
    }

    const stepsValue = Array.isArray(steps) ? JSON.stringify(steps) : '[]';

    const skill = await db.skill.create({
      data: {
        name,
        description,
        steps: stepsValue,
        icon: icon || '⚡',
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Create skill error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المهارة' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, steps, icon } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المهارة مطلوب' },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      description?: string;
      steps?: string;
      icon?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (steps !== undefined) {
      updateData.steps = Array.isArray(steps) ? JSON.stringify(steps) : steps;
    }
    if (icon !== undefined) updateData.icon = icon;

    const skill = await db.skill.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المهارة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المهارة مطلوب' },
        { status: 400 }
      );
    }

    await db.skill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المهارة' },
      { status: 500 }
    );
  }
}
