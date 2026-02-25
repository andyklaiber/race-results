import { describe, it, expect } from 'vitest'
import RaceReg from '../src/components/registration/RaceReg.vue'
import _ from 'lodash'

describe('RaceReg Optional Purchases Sorting', () => {
    it('sorts optional purchases correctly: Free items first, then by amount', () => {
        const context = {
            raceData: {
                optionalPurchases: [
                    { id: 'p1', label: 'Expensive Shirt', amount: '25.00', isFree: false },
                    { id: 'p2', label: 'Free Sticker', amount: '0', isFree: true },
                    { id: 'p3', label: 'Cheap Socks', amount: '10.00', isFree: false },
                    { id: 'p4', label: 'Another Free Item', amount: '0', isFree: true }
                ]
            }
        }

        // Bind the computed function to the context
        // Note: RaceReg uses lodash which is imported in the script, 
        // but since we are calling the method directly, we rely on the implementation using lodash.
        // The component imports lodash as _, so we need to make sure it's available or the method works.
        // Actually, the method uses `_.orderBy`. In the component file, `_` is imported.
        // When we import the component object, the closure variables like `_` are not available to us directly,
        // BUT the methods defined in the component object should still have access to them if they were defined in the module scope.
        // However, `sortedOptionalPurchases` is a property on the object exported.
        // Wait, `sortedOptionalPurchases` uses `_.orderBy`. `_` is imported in `RaceReg.vue`.
        // So it should work because the function closes over the module scope of `RaceReg.vue`.

        const sorted = RaceReg.computed.sortedOptionalPurchases.call(context)

        expect(sorted).toHaveLength(4)
        expect(sorted[0].isFree).toBe(true)
        expect(sorted[1].isFree).toBe(true)
        expect(sorted[2].isFree).toBe(false)
        expect(sorted[3].isFree).toBe(false)

        // Verify specific order
        // Free items sorted by label (default fallback in lodash if not specified? No, I added 'label' as 3rd sort key)
        // Let's check the IDs to be sure of the expected order based on my implementation
        // Implementation: [isFree?0:1, amount, label]

        // Free items: p2 (Sticker), p4 (Another). 'Another' comes before 'Sticker' alphabetically.
        expect(sorted[0].id).toBe('p4')
        expect(sorted[1].id).toBe('p2')

        // Paid items: p3 (10.00), p1 (25.00). 10 < 25.
        expect(sorted[2].id).toBe('p3')
        expect(sorted[3].id).toBe('p1')
    })

    it('handles empty or missing optional purchases', () => {
        const contextEmpty = { raceData: { optionalPurchases: [] } }
        expect(RaceReg.computed.sortedOptionalPurchases.call(contextEmpty)).toEqual([])

        const contextNull = { raceData: null }
        expect(RaceReg.computed.sortedOptionalPurchases.call(contextNull)).toEqual([])
    })
})
