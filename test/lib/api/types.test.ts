import { describe, it, expectTypeOf } from 'vitest';
import type * as Types from '@/lib/api/types';

describe('API Types (types.ts)', () => {
    it('provides expected types without runtime errors', () => {
        // Since types.ts only contains TypeScript interfaces, there is no runtime code to test.
        // We use expectTypeOf to ensure the module compiles and exports the expected shapes.

        expectTypeOf<Exclude<keyof typeof Types, 'default'>>().not.toBeAny();

        // Sample type checking for BookingResponse
        type Booking = Types.BookingResponse;
        expectTypeOf<Booking>().toHaveProperty('token');
        expectTypeOf<Booking>().toHaveProperty('email');
        expectTypeOf<Booking>().toHaveProperty('name');
        expectTypeOf<Booking>().toHaveProperty('scheduled_at');

        // Sample type checking for LoginResponse
        type LoginResp = Types.LoginResponse;
        expectTypeOf<LoginResp>().toHaveProperty('success');
        expectTypeOf<LoginResp>().toHaveProperty('token');
        expectTypeOf<LoginResp>().toHaveProperty('role');

        // Sample type checking for SlotResponse
        type SlotResp = Types.SlotResponse;
        expectTypeOf<SlotResp>().toHaveProperty('id');
        expectTypeOf<SlotResp>().toHaveProperty('slot_datetime');
        expectTypeOf<SlotResp>().toHaveProperty('max_capacity');
        expectTypeOf<SlotResp>().toHaveProperty('current_bookings');

        // Sample type checking for EvaluationResponse
        type EvalResp = Types.EvaluationResponse;
        expectTypeOf<EvalResp>().toHaveProperty('booking');
        expectTypeOf<EvalResp>().toHaveProperty('candidate');
        expectTypeOf<EvalResp>().toHaveProperty('rounds');

        // Sample type checking for StudentAnalyticsResponse
        type StudentResp = Types.StudentAnalyticsResponse;
        expectTypeOf<StudentResp>().toHaveProperty('total_interviews');
        expectTypeOf<StudentResp>().toHaveProperty('average_scores');
        expectTypeOf<StudentResp>().toHaveProperty('history');
    });
});
