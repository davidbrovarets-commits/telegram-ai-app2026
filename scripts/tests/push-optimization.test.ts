
import { evaluateSource, canAutoOptimize, updateSourceState } from '../optimization/push-optimization-engine';
import { PushSourceState, MetricsSnapshot, OPTIMIZATION_CONFIG } from '../optimization/push-state-model';

// Mock DB interactions for updateSourceState if needed, 
// but we primarily test evaluateSource which is pure logic.

const TEST_SOURCE_ID = 'city_leipzig_garbage_TEST';
const TEST_SCOPE = 'CITY';
const TEST_PRIORITY = 'MEDIUM';

function createMockMetrics(actionRate: number, delivered = 100): MetricsSnapshot {
    return {
        evaluation_window_days: 14,
        delivered_count: delivered,
        opened_count: 50,
        clicked_count: 10,
        action_completed_count: Math.floor(delivered * actionRate),
        action_rate: actionRate,
        evaluation_date: new Date().toISOString()
    };
}

async function runTest() {
    console.log('=== STARTING PUSH OPTIMIZATION LOGIC TEST ===');

    // -----------------------------------------------------
    // Rule 1: Low Performance (Soft Suppression)
    // -----------------------------------------------------
    console.log('\n--- Test 1: Rule 1 (Low Performance) ---');
    const metrics1 = createMockMetrics(0.01); // 1%
    const result1 = evaluateSource(TEST_SOURCE_ID, TEST_SCOPE, TEST_PRIORITY, null, metrics1);

    console.log(`Action Rate: ${(metrics1.action_rate * 100).toFixed(1)}%`);
    console.log(`Result: ${result1.new_state} (${result1.reason})`);

    if (result1.new_state !== 'soft_suppressed') throw new Error('Failed Rule 1');
    if (result1.rule_triggered !== 'rule_1_low_action_rate') throw new Error('Wrong rule triggered');
    console.log('✅ Rule 1 Passed');

    // -----------------------------------------------------
    // Rule 2: Recovery
    // -----------------------------------------------------
    console.log('\n--- Test 2: Rule 2 (Recovery) ---');
    const metrics2 = createMockMetrics(0.05); // 5%
    const stateSoft: PushSourceState = {
        source_id: TEST_SOURCE_ID,
        scope: TEST_SCOPE,
        priority: TEST_PRIORITY,
        state: 'soft_suppressed',
        last_evaluated_at: new Date().toISOString(),
        reason: 'rule_1_low_action_rate',
        consecutive_low_periods: 0,
        metrics_snapshot: metrics1,
        manual_override: false
    };

    const result2 = evaluateSource(TEST_SOURCE_ID, TEST_SCOPE, TEST_PRIORITY, stateSoft, metrics2);

    console.log(`Action Rate: ${(metrics2.action_rate * 100).toFixed(1)}%`);
    console.log(`Result: ${result2.new_state} (${result2.reason})`);

    if (result2.new_state !== 'active') throw new Error('Failed Rule 2');
    if (result2.rule_triggered !== 'rule_2_recovery') throw new Error('Wrong rule triggered');
    console.log('✅ Rule 2 Passed');

    // -----------------------------------------------------
    // Rule 3: Chronic Low Value (Hard Suppression)
    // -----------------------------------------------------
    console.log('\n--- Test 3: Rule 3 (Chronic Low Value) ---');
    const metrics3 = createMockMetrics(0.01);
    const stateChronic: PushSourceState = {
        ...stateSoft,
        consecutive_low_periods: 2 // Next one will be 3
    };

    const result3 = evaluateSource(TEST_SOURCE_ID, TEST_SCOPE, TEST_PRIORITY, stateChronic, metrics3);

    console.log(`Consecutive Low (Before): ${stateChronic.consecutive_low_periods}`);
    console.log(`Result: ${result3.new_state} (${result3.reason})`);

    if (result3.new_state !== 'hard_suppressed') throw new Error('Failed Rule 3');
    if (result3.rule_triggered !== 'rule_3_chronic_low_value') throw new Error('Wrong rule triggered');
    console.log('✅ Rule 3 Passed');

    // -----------------------------------------------------
    // Safety Guards
    // -----------------------------------------------------
    console.log('\n--- Test 4: Safety Guards ---');

    // High Priority
    const guard1 = canAutoOptimize('test', 'CITY', 'HIGH');
    if (guard1.allowed) throw new Error('Safety Fail: HIGH priority should be blocked');
    console.log('✅ HIGH priority blocked');

    // Land Scope
    const guard2 = canAutoOptimize('test', 'LAND', 'MEDIUM');
    if (guard2.allowed) throw new Error('Safety Fail: LAND scope should be blocked');
    console.log('✅ LAND scope blocked');

    // Protected Source
    const guard3 = canAutoOptimize('city_leipzig_jobcenter', 'CITY', 'MEDIUM');
    if (guard3.allowed) throw new Error('Safety Fail: Jobcenter source should be blocked');
    console.log('✅ Jobcenter source blocked');

    console.log('\n=== LOGIC TESTS PASSED ===');
}

runTest().catch(e => {
    console.error('TEST FAILED:', e);
    process.exit(1);
});
