import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, TripType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,6})?$/; // km / lat / lng — exact decimal string, never float (#1)
const SIGNED_DECIMAL = /^-?\d+(\.\d{1,6})?$/; // lat/lng may be negative

/** One stop on a kilometre route (address + coordinates; stored for the record). */
export class KmStopInput {
  @ApiProperty({ example: 0, description: 'Order of this stop along the route (0-based).' })
  @IsInt()
  @Min(0)
  stop_order!: number;

  @ApiProperty({ example: '123 Main St, Winnipeg' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: '49.895100', description: 'Latitude (decimal string).' })
  @Matches(SIGNED_DECIMAL, { message: 'lat must be a decimal string' })
  lat!: string;

  @ApiProperty({ example: '-97.138400', description: 'Longitude (decimal string).' })
  @Matches(SIGNED_DECIMAL, { message: 'lng must be a decimal string' })
  lng!: string;
}

/** Kilometre log for a `km` item — the total route distance + trip type drive the payable amount. */
export class KmLogInput {
  @ApiProperty({ enum: TripType, example: 'round' })
  @IsEnum(TripType)
  trip_type!: TripType;

  @ApiProperty({ example: '130.00', description: "Route's total driven distance in km (decimal string)." })
  @Matches(DECIMAL, { message: 'total_km must be a decimal string' })
  total_km!: string;

  @ApiProperty({ type: [KmStopInput] })
  @IsArray()
  @ArrayMinSize(2) // a trip needs at least an origin + a destination
  @ValidateNested({ each: true })
  @Type(() => KmStopInput)
  stops!: KmStopInput[];
}

/** One line on a weekly expense report. `km` items carry a km log (amount is computed); all others
 *  carry an `amount` and (per the category's config) a `receipt_url`. */
export class ExpenseItemInput {
  @ApiProperty({ enum: ExpenseCategory, example: 'meals' })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Optional client this expense is attributed to.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({ example: '2026-03-10' })
  @Matches(DATE, { message: 'expense_date must be a YYYY-MM-DD date' })
  expense_date!: string;

  @ApiPropertyOptional({
    example: '42.50',
    description: 'Amount (decimal string). Required for non-km items; ignored for km (computed).',
  })
  @IsOptional()
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount?: string;

  @ApiProperty({ example: 'Lunch with client' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @ApiPropertyOptional({ description: 'Object-storage reference; mandatory per the category config.' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  receipt_url?: string;

  @ApiPropertyOptional({ type: KmLogInput, description: 'Required for `km` items; forbidden otherwise.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KmLogInput)
  km?: KmLogInput;
}

/**
 * Submit a weekly expense report with its items. — SRS EXP-001..004
 * `rep_id` defaults to the submitter's linked rep; the pay period is derived from `week_start`.
 */
export class CreateReportDto {
  @ApiProperty({ example: '2026-03-09', description: 'Week start (governs the pay period).' })
  @Matches(DATE, { message: 'week_start must be a YYYY-MM-DD date' })
  week_start!: string;

  @ApiProperty({ example: '2026-03-15' })
  @Matches(DATE, { message: 'week_end must be a YYYY-MM-DD date' })
  week_end!: string;

  @ApiPropertyOptional({
    description: 'Rep this report is for; defaults to the submitter’s linked rep.',
  })
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiProperty({ type: [ExpenseItemInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemInput)
  items!: ExpenseItemInput[];
}
