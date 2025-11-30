// --- Import API Client ---
import { ApiClient, type Vendor, type VendorRequest } from './ApiService';

// --- Interfaces ---

export type VendorStatus = 'Hired' | 'Pending' | 'Rejected' | 'In Progress' | 'Completed';

export interface NegotiationStrategy {
    strategyName: string;
    toneToAdopt: string;
    recommendedBullets: string[];
    counterOfferAmount: number;
    psychologicalMechanism: string;
    whyThisWorks: string;
    successProbability: number;
}

export interface NegotiationMetadata {
    // Commercial Context
    productName: string;
    quantities: string;
    dealTermMonths: number | null;
    
    // Sentiment Analysis
    currentSentiment: string;
    sentimentTrajectory: string;
    sellerPersonalityProfile: string;
    sellerDesperationScore: number; // 1-10
    relationshipWarmthScore: number; // 1-10
    
    // Timeline
    criticalDeadlines: string[];
    daysUntilDeadline: number;
    sellerUrgencyScore: number; // 1-10
    threadDuration: string;
    messageCountBuyer: number;
    messageCountSeller: number;
    avgResponseTimeHours: number;
    
    // Pricing
    sellerQuotedPrices: string[];
    buyerTargetPrice: string;
    latestQuotedPrice: number;
    latestDiscountPercentage: number;
    currency: string;
    
    // Negotiation Status
    overallDealHealthScore: number; // 0-100
    dealPhase: string;
    offerSaturationLevel: string;
    remainingWiggleRoom: number; // percentage
    leverageDistribution: string;
    leverageReasoning: string;
    stalemateRiskProbability: number; // percentage
    buyerPowerIndex: number; // 1-10
    sellerFloorHitProbability: number; // percentage
    concessionVelocityScore: number; // 1-10
    walkAwayReadiness: string;
    
    // Parties
    buyerEntityName: string;
    sellerEntityName: string;
    sellerLocation: string;
    decisionMakers: string[];
    decisionMakerIdentified: boolean;
    sellerTeamSize: number;
    
    // Constraints
    mustHaveRequirements: string[];
    niceToHaveRequirements: string[];
    complianceObligations: string[];
    legalContractualBlockers: string[];
    legalComplexityScore: number; // 1-10
    
    // Concessions
    sellerConcessions: string[];
    buyerConcessions: string[];
    firstOfferAnchor: string;
    
    // Strategy Recommendations
    strategies: NegotiationStrategy[];
    recommendedStrategy: string;
    strategySuccessProbability: number;
    suggestedNextMove: string;
    marketContextSummary: string;
    summary: string;
}


// --- Raw JSON Type ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawJsonData = Record<string, any>;

// --- Generic JSON Parser Utilities ---

/**
 * Safely extracts a value from an object using multiple possible keys
 */
function getNestedValue(obj: RawJsonData | undefined, ...keys: string[]): unknown {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined) return obj[key];
    }
    return undefined;
}

/**
 * Formats price values to display strings
 */
function formatPrices(prices: unknown): string[] {
    if (!prices) return [];
    if (Array.isArray(prices)) {
        return prices.map((p: unknown) => {
            if (typeof p === 'number') return `$${p.toLocaleString()}`;
            if (typeof p === 'string') return p.startsWith('$') ? p : `$${p}`;
            return String(p);
        });
    }
    return [];
}

/**
 * Ensures a value is an array of strings
 */
function ensureStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v));
    if (typeof value === 'string') return [value];
    return [];
}

/**
 * Parses a numeric value, returning a default if not found
 */
function parseNumber(value: unknown, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
}

/**
 * Generic parser that handles both JSON formats:
 * - TrueData2.json format (phase_1/2/3 structure)
 * - AllAgentDATA.json format (flat structure with spaced keys)
 */
export function parseJsonToNegotiationMetadata(rawData: RawJsonData): NegotiationMetadata {
    // Detect format: TrueData2.json has phase_1, AllAgentDATA.json has flat structure
    const isPhaseFormat = rawData.phase_1 !== undefined;
    
    // Extract sections based on format
    const commercialContext = isPhaseFormat 
        ? rawData.phase_1?.CommercialContext 
        : rawData['Commercial Context'] || {};
    
    const sentimentAnalysis = isPhaseFormat 
        ? rawData.phase_1?.SentimentAnalysis 
        : rawData['Sentiment Analysis'] || {};
    
    const toneAndStrategy = isPhaseFormat 
        ? rawData.phase_1?.ToneAndStrategyCues 
        : rawData['Tone and Strategy Cues'] || {};
    
    const technicalArtifacts = isPhaseFormat 
        ? rawData.phase_1?.TechnicalArtifacts 
        : rawData['Technical Artifacts'] || {};
    
    const timelineInfo = isPhaseFormat 
        ? rawData.phase_1?.TimelineInformation 
        : rawData['Timeline Information'] || {};
    
    const pricingInfo = isPhaseFormat 
        ? rawData.phase_1?.PricingInformation 
        : rawData['Pricing Information'] || {};
    
    const constraints = isPhaseFormat 
        ? rawData.phase_1?.HeavyConstraints 
        : rawData['Heavy Constraints'] || {};
    
    const parties = isPhaseFormat 
        ? rawData.phase_1?.PartiesAndRoles 
        : rawData['Parties and Roles'] || {};
    
    const concessions = isPhaseFormat 
        ? rawData.phase_1?.ConcessionsAndSignals 
        : rawData['Concessions and Negotiation Signals'] || {};
    
    const negotiationStatus = isPhaseFormat 
        ? rawData.phase_2?.NegotationStatus 
        : rawData['Negotiation Status & Health'] || {};
    
    const summarySection = isPhaseFormat 
        ? rawData.phase_2?.SummaryProvider 
        : rawData['Summary'] || {};
    
    const strategies = isPhaseFormat 
        ? rawData.phase_3 
        : rawData['Research-Backed Response Strategies'] || {};

    // Build the NegotiationMetadata object
    return {
        // Commercial Context
        productName: String(
            getNestedValue(commercialContext, 'product_or_service_name', 'productName') || 
            'Unknown Product'
        ),
        quantities: String(
            getNestedValue(commercialContext, 'quantities') || 
            'Not specified'
        ),
        dealTermMonths: commercialContext?.deal_term_months ?? null,
        
        // Sentiment Analysis
        currentSentiment: String(
            getNestedValue(sentimentAnalysis, 'current_conversation_sentiment', 'currentSentiment') || 
            'Neutral'
        ),
        sentimentTrajectory: String(
            getNestedValue(sentimentAnalysis, 'sentiment_trajectory', 'sentimentTrajectory') || 
            'Stable'
        ),
        sellerPersonalityProfile: String(
            getNestedValue(sentimentAnalysis, 'seller_personality_profile', 'sellerPersonalityProfile') || 
            'Unknown'
        ),
        sellerDesperationScore: parseNumber(
            getNestedValue(sentimentAnalysis, 'seller_desperation_score', 'sellerDesperationScore'), 
            5
        ),
        relationshipWarmthScore: parseNumber(
            getNestedValue(sentimentAnalysis, 'relationship_warmth_score', 'relationshipWarmthScore'), 
            5
        ),
        
        // Timeline
        criticalDeadlines: ensureStringArray(
            getNestedValue(timelineInfo, 'critical_deadlines', 'criticalDeadlines')
        ),
        daysUntilDeadline: parseNumber(
            getNestedValue(timelineInfo, 'days_until_critical_deadline', 'daysUntilDeadline'), 
            0
        ),
        sellerUrgencyScore: parseNumber(
            getNestedValue(timelineInfo, 'seller_urgency_score', 'sellerUrgencyScore'), 
            5
        ),
        threadDuration: String(
            getNestedValue(technicalArtifacts, 'thread_duration', 'threadDuration') || 
            'Unknown'
        ),
        messageCountBuyer: parseNumber(
            getNestedValue(technicalArtifacts, 'message_count_buyer', 'messageCountBuyer'), 
            0
        ),
        messageCountSeller: parseNumber(
            getNestedValue(technicalArtifacts, 'message_count_seller', 'messageCountSeller'), 
            0
        ),
        avgResponseTimeHours: parseNumber(
            getNestedValue(technicalArtifacts, 'avg_response_time_hours_seller', 'avgResponseTimeHours'), 
            0
        ),
        
        // Pricing
        sellerQuotedPrices: formatPrices(
            getNestedValue(pricingInfo, 'seller_quoted_prices', 'sellerQuotedPrices')
        ),
        buyerTargetPrice: (() => {
            const target = getNestedValue(pricingInfo, 'buyer_target_price', 'buyerTargetPrice');
            if (typeof target === 'number') return `$${target.toLocaleString()}`;
            return String(target || 'Not specified');
        })(),
        latestQuotedPrice: parseNumber(
            getNestedValue(pricingInfo, 'latest_quoted_price_numeric', 'latestQuotedPrice'), 
            0
        ),
        latestDiscountPercentage: parseNumber(
            getNestedValue(pricingInfo, 'latest_discount_percentage', 'latestDiscountPercentage'), 
            0
        ),
        currency: String(
            getNestedValue(pricingInfo, 'currency_code', 'currency') || 
            'USD'
        ),
        
        // Negotiation Status
        overallDealHealthScore: parseNumber(
            getNestedValue(negotiationStatus, 'overall_deal_health_score', 'overallDealHealthScore'), 
            50
        ),
        dealPhase: String(
            getNestedValue(negotiationStatus, 'deal_phase', 'dealPhase') || 
            'Unknown'
        ),
        offerSaturationLevel: String(
            getNestedValue(negotiationStatus, 'offer_saturation_level', 'offerSaturationLevel') || 
            'Unknown'
        ),
        remainingWiggleRoom: parseNumber(
            getNestedValue(negotiationStatus, 'remaining_price_wiggle_room_estimate', 'remainingWiggleRoom'), 
            0
        ),
        leverageDistribution: String(
            getNestedValue(negotiationStatus, 'leverage_distribution', 'leverageDistribution') || 
            'Balanced'
        ),
        leverageReasoning: String(
            getNestedValue(negotiationStatus, 'leverage_reasoning', 'leverageReasoning') || 
            'No reasoning available'
        ),
        stalemateRiskProbability: parseNumber(
            getNestedValue(negotiationStatus, 'stalemate_risk_probability', 'stalemateRiskProbability'), 
            0
        ),
        buyerPowerIndex: parseNumber(
            getNestedValue(toneAndStrategy, 'buyer_power_index', 'buyerPowerIndex'), 
            5
        ),
        sellerFloorHitProbability: parseNumber(
            getNestedValue(concessions, 'seller_floor_hit_probability', 'sellerFloorHitProbability'), 
            0
        ),
        concessionVelocityScore: parseNumber(
            getNestedValue(concessions, 'concession_velocity_score', 'concessionVelocityScore'), 
            5
        ),
        walkAwayReadiness: String(
            getNestedValue(negotiationStatus, 'walk_away_readiness', 'walkAwayReadiness') || 
            'Unknown'
        ),
        
        // Parties
        buyerEntityName: String(
            getNestedValue(parties, 'buyer_entity_name', 'buyerEntityName') || 
            'Unknown Buyer'
        ),
        sellerEntityName: String(
            getNestedValue(parties, 'seller_entity_name', 'sellerEntityName') || 
            'Unknown Seller'
        ),
        sellerLocation: String(
            getNestedValue(parties, 'seller_global_location', 'sellerLocation') || 
            'Unknown Location'
        ),
        decisionMakers: ensureStringArray(
            getNestedValue(parties, 'decision_makers', 'decisionMakers')
        ),
        decisionMakerIdentified: Boolean(
            getNestedValue(parties, 'decision_maker_identified', 'decisionMakerIdentified')
        ),
        sellerTeamSize: parseNumber(
            getNestedValue(parties, 'seller_team_size', 'sellerTeamSize'), 
            1
        ),
        
        // Constraints
        mustHaveRequirements: ensureStringArray(
            getNestedValue(constraints, 'must_have_requirements', 'mustHaveRequirements')
        ),
        niceToHaveRequirements: ensureStringArray(
            getNestedValue(constraints, 'nice_to_have_requirements', 'niceToHaveRequirements')
        ),
        complianceObligations: ensureStringArray(
            getNestedValue(constraints, 'compliance_obligations', 'complianceObligations')
        ),
        legalContractualBlockers: ensureStringArray(
            getNestedValue(constraints, 'legal_contractual_blockers', 'legalContractualBlockers')
        ),
        legalComplexityScore: parseNumber(
            getNestedValue(constraints, 'legal_complexity_score', 'legalComplexityScore'), 
            5
        ),
        
        // Concessions
        sellerConcessions: ensureStringArray(
            getNestedValue(concessions, 'seller_concessions', 'sellerConcessions')
        ),
        buyerConcessions: ensureStringArray(
            getNestedValue(concessions, 'buyer_concessions', 'buyerConcessions')
        ),
        firstOfferAnchor: (() => {
            const anchor = getNestedValue(concessions, 'first_offer_anchor', 'firstOfferAnchor');
            if (typeof anchor === 'number') return `$${anchor.toLocaleString()}`;
            return String(anchor || 'Not specified');
        })(),
        
        // Strategy Recommendations
        strategies: (() => {
            const strategyList = strategies?.strategies;
            if (Array.isArray(strategyList)) {
                return strategyList.map((s: RawJsonData) => ({
                    strategyName: String(s.strategy_name || 'Unknown'),
                    toneToAdopt: String(s.tone_to_adopt || 'Neutral'),
                    recommendedBullets: ensureStringArray(s.recommended_email_body_bullets),
                    counterOfferAmount: parseNumber(s.specific_counter_offer_amount, 0),
                    psychologicalMechanism: String(s.psychological_mechanism_used || ''),
                    whyThisWorks: String(s.why_this_works || ''),
                    successProbability: parseNumber(s.success_probability, 50),
                }));
            }
            return [];
        })(),
        recommendedStrategy: String(
            getNestedValue(strategies, 'best_strategy_recommendation', 'recommendedStrategy') || 
            'No recommendation'
        ),
        strategySuccessProbability: (() => {
            const strategyList = strategies?.strategies;
            if (Array.isArray(strategyList) && strategyList.length > 0) {
                return parseNumber(strategyList[0].success_probability, 50);
            }
            return 50;
        })(),
        suggestedNextMove: String(
            getNestedValue(toneAndStrategy, 'suggested_next_move', 'suggestedNextMove') || 
            'Continue negotiation'
        ),
        marketContextSummary: String(
            getNestedValue(strategies, 'market_context_summary', 'marketContextSummary') || 
            ''
        ),
        summary: String(
            getNestedValue(summarySection, 'summary') || 
            'No summary available'
        ),
    };
}

// --- Statistics Cache for Comparison ---
// Stores loaded statistics by vendor_id for use across pages
const statisticsCache: Map<string, NegotiationMetadata> = new Map();

// Export cache access functions
export function getCachedStatistics(vendor_id: string): NegotiationMetadata | undefined {
    return statisticsCache.get(vendor_id);
}

export function getAllCachedStatistics(): Map<string, NegotiationMetadata> {
    return statisticsCache;
}

export function getCachedStatisticsArray(): { vendorId: string; data: NegotiationMetadata }[] {
    return Array.from(statisticsCache.entries()).map(([vendorId, data]) => ({ vendorId, data }));
}

export function clearStatisticsCache(): void {
    statisticsCache.clear();
}

// Load any previously saved statistics from localStorage on module init
function loadCacheFromStorage(): void {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('vendor_') && k.endsWith('_statistics'));
        keys.forEach(key => {
            const vendorId = key.replace('vendor_', '').replace('_statistics', '');
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    statisticsCache.set(vendorId, parsed);
                } catch (e) {
                    console.warn(`Failed to parse cached statistics for ${vendorId}`);
                }
            }
        });
        console.log(`Loaded ${statisticsCache.size} cached statistics from storage`);
    } catch (e) {
        console.warn('Failed to load statistics cache from storage');
    }
}

// Initialize cache from localStorage
loadCacheFromStorage();


// --- Service Class ---

export class VendorService {

    async getVendorsByProjectId(projectId: string): Promise<Vendor[]> {
        const apiClient = new ApiClient(); 
        const project = await apiClient.getProject(projectId);
        return project.vendors;
    }

    async getVendorById(vendor_id: string): Promise<Vendor | null> {
        const apiClient = new ApiClient(); 
        const vendor = await apiClient.getVendor(vendor_id);
        console.log('Fetched vendor:', vendor);
        return vendor;
    }

    async addVendor(vendorData: Omit<Vendor, 'vendor_id'>): Promise<Vendor> {
        const apiClient = new ApiClient(); 
        const VendorDTO: VendorRequest = {
            ...vendorData,
        };
        const newVendor = await apiClient.createVendor(VendorDTO);
        return newVendor;
    }

    async updateVendor(vendorData: Vendor): Promise<Vendor> {
        const apiClient = new ApiClient(); 
        const updatedVendor = await apiClient.updateVendor(vendorData.vendor_id, vendorData);
        return updatedVendor;
    }

    /**
     * Fetches statistics for a vendor, parses them using parseJsonToNegotiationMetadata,
     * caches the result, and saves to localStorage for persistence.
     */
    async getStatistics(vendor_id: string): Promise<NegotiationMetadata> {
        const apiClient = new ApiClient(); 
        const rawStatistics = await apiClient.getStatistics(vendor_id);
        
        // Parse the raw JSON into our structured NegotiationMetadata format
        const parsedStatistics = parseJsonToNegotiationMetadata(rawStatistics);
        
        // Cache the statistics for comparison use
        statisticsCache.set(vendor_id, parsedStatistics);
        
        // Also save to localStorage for persistence
        localStorage.setItem(`vendor_${vendor_id}_statistics`, JSON.stringify(parsedStatistics));
        
        console.log(`Statistics loaded and cached for vendor ${vendor_id}`);
        return parsedStatistics;
    }

    /**
     * Get cached statistics without fetching (useful for comparison page)
     */
    getCachedStatistics(vendor_id: string): NegotiationMetadata | undefined {
        return statisticsCache.get(vendor_id);
    }

    /**
     * Get all cached statistics for comparison
     */
    getAllCachedStatistics(): Map<string, NegotiationMetadata> {
        return statisticsCache;
    }

    /**
     * Check if statistics are cached for a vendor
     */
    hasStatistics(vendor_id: string): boolean {
        return statisticsCache.has(vendor_id);
    }

    /**
     * Get statistics for multiple vendors (for comparison)
     */
    async getStatisticsForMultiple(vendor_ids: string[]): Promise<Map<string, NegotiationMetadata>> {
        const results = new Map<string, NegotiationMetadata>();
        
        await Promise.all(
            vendor_ids.map(async (vendor_id) => {
                try {
                    // Check cache first
                    if (statisticsCache.has(vendor_id)) {
                        results.set(vendor_id, statisticsCache.get(vendor_id)!);
                    } else {
                        const stats = await this.getStatistics(vendor_id);
                        results.set(vendor_id, stats);
                    }
                } catch (error) {
                    console.error(`Failed to load statistics for vendor ${vendor_id}:`, error);
                }
            })
        );
        
        return results;
    }
}
