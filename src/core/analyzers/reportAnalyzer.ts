/**
 * Report analyzer.
 *
 * Composes existing analyzers into a single {@link ReportData} dataset for the
 * HTML report. It adds no new git logic — it simply orchestrates the building
 * blocks, which keeps the report in sync with the individual commands.
 */
import type { AnalysisOptions, ReportData } from '../models/types.js';
import { analyzeSummary } from './summaryAnalyzer.js';
import { analyzeHotspots } from './hotspotsAnalyzer.js';
import { analyzeCoupling } from './couplingAnalyzer.js';
import { analyzeBusFactor } from './busFactorAnalyzer.js';
import { analyzeActivity } from './activityAnalyzer.js';

const REPORT_HOTSPOTS = 15;
const REPORT_COUPLING = 15;
const REPORT_BUS_FACTOR = 10;

export interface ReportOptions extends AnalysisOptions {
  /** Number of hotspot files to include in the report. */
  readonly hotspotLimit?: number;
}

export async function analyzeReport(options: ReportOptions): Promise<ReportData> {
  const [summary, hotspots, coupling, busFactor, activity] = await Promise.all([
    analyzeSummary(options),
    analyzeHotspots({ ...options, limit: options.hotspotLimit ?? REPORT_HOTSPOTS }),
    analyzeCoupling({ ...options, top: REPORT_COUPLING }),
    analyzeBusFactor({ ...options, top: REPORT_BUS_FACTOR }),
    analyzeActivity(options),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    hotspots,
    coupling,
    busFactor,
    activity,
  };
}
