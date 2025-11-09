/**
 * Integration test for UserSettings database operations
 * This verifies that the UserSettings CRUD operations work correctly
 */

import { db } from '../src/lib/db';

async function testUserSettings() {
  console.log('🧪 Testing UserSettings CRUD operations...\n');
  
  try {
    const testUserId = 'test-user-' + Date.now();
    
    // Test 1: Create user settings
    console.log('Test 1: Create user settings');
    const created = await db.createUserSettings({
      userId: testUserId,
      apiKey: 'sk-test-key-123',
      apiEndpoint: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
    });
    console.log('✓ Created:', {
      id: created.id,
      userId: created.userId,
      apiKey: created.apiKey?.substring(0, 10) + '...',
      apiEndpoint: created.apiEndpoint,
      model: created.model,
    });
    console.log();
    
    // Test 2: Get user settings
    console.log('Test 2: Get user settings');
    const retrieved = await db.getUserSettings(testUserId);
    if (!retrieved) {
      throw new Error('Failed to retrieve settings');
    }
    console.log('✓ Retrieved:', {
      id: retrieved.id,
      userId: retrieved.userId,
      apiKey: retrieved.apiKey?.substring(0, 10) + '...',
    });
    console.log();
    
    // Test 3: Update user settings
    console.log('Test 3: Update user settings');
    const updated = await db.updateUserSettings(testUserId, {
      apiKey: 'sk-updated-key-456',
      model: 'gpt-4',
    });
    if (!updated) {
      throw new Error('Failed to update settings');
    }
    console.log('✓ Updated:', {
      apiKey: updated.apiKey?.substring(0, 10) + '...',
      model: updated.model,
    });
    console.log();
    
    // Test 4: Verify update
    console.log('Test 4: Verify update');
    const verified = await db.getUserSettings(testUserId);
    if (!verified) {
      throw new Error('Failed to verify settings');
    }
    const isCorrect = 
      verified.apiKey === 'sk-updated-key-456' && 
      verified.model === 'gpt-4' &&
      verified.apiEndpoint === 'https://api.openai.com/v1'; // Should remain unchanged
    
    if (!isCorrect) {
      throw new Error('Settings not updated correctly');
    }
    console.log('✓ Verification passed');
    console.log();
    
    // Test 5: Update non-existent settings (should create)
    console.log('Test 5: Update non-existent settings (auto-create)');
    const newUserId = 'test-user-new-' + Date.now();
    const autoCreated = await db.updateUserSettings(newUserId, {
      apiKey: 'sk-auto-created',
      apiEndpoint: 'https://custom.api.com/v1',
      model: 'gpt-4-turbo',
    });
    if (!autoCreated) {
      throw new Error('Failed to auto-create settings');
    }
    console.log('✓ Auto-created for new user:', {
      userId: autoCreated.userId,
      model: autoCreated.model,
    });
    console.log();
    
    // Test 6: Delete user settings
    console.log('Test 6: Delete user settings');
    await db.deleteUserSettings(testUserId);
    const deleted = await db.getUserSettings(testUserId);
    if (deleted !== null) {
      throw new Error('Settings not deleted');
    }
    console.log('✓ Deleted successfully');
    console.log();
    
    // Cleanup
    await db.deleteUserSettings(newUserId);
    
    console.log('✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testUserSettings().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export { testUserSettings };
