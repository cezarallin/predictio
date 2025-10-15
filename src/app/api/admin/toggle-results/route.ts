import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, getAppSetting, setAppSetting } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const result = getAppSetting.get('results_enabled') as { value: string } | undefined;
    const isEnabled = result?.value === 'true';
    
    return NextResponse.json({ 
      resultsEnabled: isEnabled
    });
  } catch (error) {
    console.error('Error getting results setting:', error);
    return NextResponse.json({ error: 'Failed to get results setting' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { adminUserId, enabled } = await request.json();
    
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID is required' }, { status: 400 });
    }
    
    // Verify user is admin
    const user = await new Promise((resolve, reject) => {
      try {
        const result = getUserByName.get(adminUserId);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    if (!user || !(user as any).is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Toggle or set the results_enabled setting
    const newValue = enabled !== undefined ? (enabled ? 'true' : 'false') : 
                     (getAppSetting.get('results_enabled') as { value: string } | undefined)?.value === 'true' ? 'false' : 'true';
    
    setAppSetting.run('results_enabled', newValue);
    
    console.log(`🔧 Admin ${adminUserId} ${newValue === 'true' ? 'enabled' : 'disabled'} results column`);

    return NextResponse.json({ 
      message: `Results column ${newValue === 'true' ? 'enabled' : 'disabled'}`,
      resultsEnabled: newValue === 'true',
      updatedBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error toggling results:', error);
    return NextResponse.json({ error: 'Failed to toggle results' }, { status: 500 });
  }
}

