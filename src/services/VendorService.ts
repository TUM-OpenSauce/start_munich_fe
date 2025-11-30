import { v4 as uuidv4 } from 'uuid';

// --- Import JSON Data ---
// Import the JSON files directly (Vite handles JSON imports)
import trueData2Json from '../../TrueData2.json';
import allAgentDataJson from '../../AllAgentDATA.json';
import { ApiClient, type Vendor, type VendorRequest } from './ApiService';

// --- Interfaces ---

export type VendorStatus = 'Hired' | 'Pending' | 'Rejected' | 'In Progress' | 'Completed';

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
    stalemateRiskProbability: number; // percentage
    buyerPowerIndex: number; // 1-10
    sellerFloorHitProbability: number; // percentage
    concessionVelocityScore: number; // 1-10
    
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
    legalComplexityScore: number; // 1-10
    
    // Concessions
    sellerConcessions: string[];
    buyerConcessions: string[];
    firstOfferAnchor: string;
    
    // Strategy Recommendation
    recommendedStrategy: string;
    strategySuccessProbability: number;
    suggestedNextMove: string;
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
        
        // Strategy Recommendation
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
        summary: String(
            getNestedValue(summarySection, 'summary') || 
            'No summary available'
        ),
    };
}

// --- Parse JSON files at module load ---
const parsedVendor1Data = parseJsonToNegotiationMetadata(trueData2Json);
const parsedVendor2Data = parseJsonToNegotiationMetadata(allAgentDataJson);


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

}
