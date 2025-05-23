/**
 * A/B Testing Framework
 *
 * Comprehensive A/B testing system with experiment management,
 * variant assignment, and statistical analysis.
 */

import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  type: "page" | "component" | "feature" | "content";

  // Configuration
  trafficAllocation: number; // Percentage of users to include (0-100)
  variants: Variant[];
  targetingRules: TargetingRules;

  // Schedule
  startDate: Date;
  endDate?: Date;
  duration?: number; // Duration in days

  // Goals and metrics
  primaryGoal: Goal;
  secondaryGoals: Goal[];

  // Results
  results?: ExperimentResults;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  trafficSplit: number; // Percentage of experiment traffic (0-100)
  configuration: Record<string, any>;
  isControl: boolean;
}

export interface TargetingRules {
  includeRules: TargetingRule[];
  excludeRules: TargetingRule[];
}

export interface TargetingRule {
  type:
    | "device"
    | "location"
    | "user_property"
    | "page"
    | "referrer"
    | "custom";
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than";
  value: string | string[] | number;
  attribute?: string; // For user_property and custom rules
}

export interface Goal {
  id: string;
  name: string;
  type: "conversion" | "engagement" | "revenue" | "custom";
  event: string; // Event type to track
  operator?: "count" | "sum" | "average" | "unique";
  value?: number; // Target value for comparison
}

export interface ExperimentResults {
  status:
    | "insufficient_data"
    | "no_significant_difference"
    | "significant_winner"
    | "significant_loser";
  confidence: number; // Confidence level (0-1)
  winningVariant?: string;

  variantResults: Record<string, VariantResults>;
  statisticalSignificance: StatisticalTest;

  calculatedAt: Date;
  sampleSize: number;
  conversionRates: Record<string, number>;
}

export interface VariantResults {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  averageValue?: number;
  engagementMetrics: Record<string, number>;
}

export interface StatisticalTest {
  testType: "chi_square" | "t_test" | "z_test";
  pValue: number;
  confidenceInterval: [number, number];
  effectSize: number;
  powerAnalysis?: number;
}

export interface UserAssignment {
  userId?: string;
  sessionId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  deviceInfo: Record<string, any>;
  userProperties: Record<string, any>;
}

export interface ExperimentEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  goalId: string;
  eventType: string;
  value?: number;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class ABTestingFramework {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getAdminFirestore();
  }

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(
    experiment: Omit<Experiment, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const experimentId = this.generateExperimentId();
    const now = new Date();

    // Validate experiment configuration
    this.validateExperiment(experiment);

    const experimentData: Experiment = {
      ...experiment,
      id: experimentId,
      createdAt: now,
      updatedAt: now,
    };

    // Store experiment in Firestore
    await this.db
      .collection("ab_experiments")
      .doc(experimentId)
      .set({
        ...experimentData,
        startDate: Timestamp.fromDate(experimentData.startDate),
        endDate: experimentData.endDate
          ? Timestamp.fromDate(experimentData.endDate)
          : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

    console.log(`A/B test experiment created: ${experimentId}`);
    return experimentId;
  }

  /**
   * Get variant assignment for a user/session
   */
  async getVariantAssignment(
    experimentId: string,
    sessionId: string,
    userId?: string,
    context?: Record<string, any>,
  ): Promise<string | null> {
    try {
      // Check if user already has an assignment
      const existingAssignment = await this.getExistingAssignment(
        experimentId,
        sessionId,
        userId,
      );
      if (existingAssignment) {
        return existingAssignment.variantId;
      }

      // Get experiment configuration
      const experiment = await this.getExperiment(experimentId);
      if (!experiment || experiment.status !== "running") {
        return null;
      }

      // Check if user should be included in experiment
      const shouldInclude = await this.shouldIncludeUser(
        experiment,
        context || {},
      );
      if (!shouldInclude) {
        return null;
      }

      // Assign variant based on traffic split
      const variantId = this.assignVariant(experiment, sessionId);

      // Store assignment
      await this.storeAssignment({
        userId,
        sessionId,
        experimentId,
        variantId,
        assignedAt: new Date(),
        deviceInfo: context?.device || {},
        userProperties: context?.userProperties || {},
      });

      return variantId;
    } catch (error) {
      console.error("Error getting variant assignment:", error);
      return null;
    }
  }

  /**
   * Track experiment event (conversion, engagement, etc.)
   */
  async trackExperimentEvent(
    experimentId: string,
    sessionId: string,
    goalId: string,
    eventType: string,
    value?: number,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      // Get user's assignment
      const assignment = await this.getExistingAssignment(
        experimentId,
        sessionId,
      );
      if (!assignment) {
        return; // User not part of this experiment
      }

      const eventId = this.generateEventId();
      const now = new Date();

      const experimentEvent: ExperimentEvent = {
        id: eventId,
        experimentId,
        variantId: assignment.variantId,
        userId: assignment.userId,
        sessionId,
        goalId,
        eventType,
        value,
        metadata,
        timestamp: now,
      };

      // Store event
      await this.db
        .collection("ab_events")
        .doc(eventId)
        .set({
          ...experimentEvent,
          timestamp: Timestamp.fromDate(now),
        });

      // Update experiment results in real-time
      await this.updateExperimentMetrics(experimentId);
    } catch (error) {
      console.error("Error tracking experiment event:", error);
    }
  }

  /**
   * Get experiment results and statistical analysis
   */
  async getExperimentResults(
    experimentId: string,
  ): Promise<ExperimentResults | null> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        return null;
      }

      // Get all assignments for this experiment
      const assignmentsQuery = await this.db
        .collection("ab_assignments")
        .where("experimentId", "==", experimentId)
        .get();

      const assignments = assignmentsQuery.docs.map((doc) => doc.data());

      // Get all events for this experiment
      const eventsQuery = await this.db
        .collection("ab_events")
        .where("experimentId", "==", experimentId)
        .get();

      const events = eventsQuery.docs.map((doc) => doc.data());

      // Calculate results for each variant
      const variantResults: Record<string, VariantResults> = {};

      for (const variant of experiment.variants) {
        const variantAssignments = assignments.filter(
          (a) => a.variantId === variant.id,
        );
        const variantEvents = events.filter((e) => e.variantId === variant.id);

        // Calculate conversions for primary goal
        const primaryGoalEvents = variantEvents.filter(
          (e) => e.goalId === experiment.primaryGoal.id,
        );
        const conversions = this.calculateConversions(
          primaryGoalEvents,
          experiment.primaryGoal,
        );

        const conversionRate =
          variantAssignments.length > 0
            ? conversions / variantAssignments.length
            : 0;

        // Calculate engagement metrics
        const engagementMetrics =
          this.calculateEngagementMetrics(variantEvents);

        variantResults[variant.id] = {
          variantId: variant.id,
          participants: variantAssignments.length,
          conversions,
          conversionRate,
          engagementMetrics,
        };
      }

      // Perform statistical analysis
      const statisticalTest = this.performStatisticalTest(
        variantResults,
        experiment,
      );

      // Determine experiment status
      const status = this.determineExperimentStatus(
        statisticalTest,
        variantResults,
      );
      const winningVariant = this.determineWinningVariant(
        variantResults,
        statisticalTest,
      );

      const results: ExperimentResults = {
        status,
        confidence: 1 - statisticalTest.pValue,
        winningVariant,
        variantResults,
        statisticalSignificance: statisticalTest,
        calculatedAt: new Date(),
        sampleSize: assignments.length,
        conversionRates: Object.fromEntries(
          Object.entries(variantResults).map(([id, result]) => [
            id,
            result.conversionRate,
          ]),
        ),
      };

      // Store results
      await this.storeExperimentResults(experimentId, results);

      return results;
    } catch (error) {
      console.error("Error calculating experiment results:", error);
      return null;
    }
  }

  /**
   * Get active experiments for a user context
   */
  async getActiveExperiments(
    context: Record<string, any> = {},
  ): Promise<Experiment[]> {
    try {
      const now = new Date();

      const experimentsQuery = await this.db
        .collection("ab_experiments")
        .where("status", "==", "running")
        .where("startDate", "<=", Timestamp.fromDate(now))
        .get();

      const experiments = experimentsQuery.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Experiment;
      });

      // Filter by end date and targeting rules
      const activeExperiments = experiments.filter((experiment) => {
        // Check if experiment has ended
        if (experiment.endDate && experiment.endDate <= now) {
          return false;
        }

        // Check targeting rules
        return this.shouldIncludeUser(experiment, context);
      });

      return activeExperiments;
    } catch (error) {
      console.error("Error getting active experiments:", error);
      return [];
    }
  }

  /**
   * Complete an experiment and calculate final results
   */
  async completeExperiment(
    experimentId: string,
  ): Promise<ExperimentResults | null> {
    try {
      // Calculate final results
      const results = await this.getExperimentResults(experimentId);

      // Update experiment status
      await this.db.collection("ab_experiments").doc(experimentId).update({
        status: "completed",
        updatedAt: Timestamp.now(),
        results: results,
      });

      console.log(`Experiment ${experimentId} completed`);
      return results;
    } catch (error) {
      console.error("Error completing experiment:", error);
      return null;
    }
  }

  // Private helper methods

  private validateExperiment(
    experiment: Omit<Experiment, "id" | "createdAt" | "updatedAt">,
  ): void {
    // Validate traffic splits sum to 100%
    const totalTrafficSplit = experiment.variants.reduce(
      (sum, variant) => sum + variant.trafficSplit,
      0,
    );
    if (Math.abs(totalTrafficSplit - 100) > 0.01) {
      throw new Error("Variant traffic splits must sum to 100%");
    }

    // Validate at least one control variant
    const hasControl = experiment.variants.some((variant) => variant.isControl);
    if (!hasControl) {
      throw new Error("Experiment must have at least one control variant");
    }

    // Validate traffic allocation
    if (
      experiment.trafficAllocation < 0 ||
      experiment.trafficAllocation > 100
    ) {
      throw new Error("Traffic allocation must be between 0 and 100");
    }
  }

  private async getExperiment(
    experimentId: string,
  ): Promise<Experiment | null> {
    const doc = await this.db
      .collection("ab_experiments")
      .doc(experimentId)
      .get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as any;
    return {
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Experiment;
  }

  private async getExistingAssignment(
    experimentId: string,
    sessionId: string,
    userId?: string,
  ): Promise<UserAssignment | null> {
    // Try to find by user ID first, then by session ID
    let query = this.db
      .collection("ab_assignments")
      .where("experimentId", "==", experimentId);

    if (userId) {
      query = query.where("userId", "==", userId);
    } else {
      query = query.where("sessionId", "==", sessionId);
    }

    const querySnapshot = await query.limit(1).get();

    if (querySnapshot.empty) {
      return null;
    }

    const data = querySnapshot.docs[0].data();
    return {
      ...data,
      assignedAt: data.assignedAt.toDate(),
    } as UserAssignment;
  }

  private async shouldIncludeUser(
    experiment: Experiment,
    context: Record<string, any>,
  ): Promise<boolean> {
    // Check traffic allocation
    const random = Math.random() * 100;
    if (random > experiment.trafficAllocation) {
      return false;
    }

    // Check targeting rules
    const includeRulesPass =
      experiment.targetingRules.includeRules.length === 0 ||
      experiment.targetingRules.includeRules.some((rule) =>
        this.evaluateTargetingRule(rule, context),
      );

    const excludeRulesPass =
      experiment.targetingRules.excludeRules.length === 0 ||
      !experiment.targetingRules.excludeRules.some((rule) =>
        this.evaluateTargetingRule(rule, context),
      );

    return includeRulesPass && excludeRulesPass;
  }

  private evaluateTargetingRule(
    rule: TargetingRule,
    context: Record<string, any>,
  ): boolean {
    let contextValue: any;

    switch (rule.type) {
      case "device":
        contextValue = context.device?.type;
        break;
      case "location":
        contextValue = context.location?.country;
        break;
      case "page":
        contextValue = context.page;
        break;
      case "referrer":
        contextValue = context.referrer;
        break;
      case "user_property":
        contextValue = context.userProperties?.[rule.attribute || ""];
        break;
      case "custom":
        contextValue = context[rule.attribute || ""];
        break;
      default:
        return false;
    }

    return this.evaluateCondition(contextValue, rule.operator, rule.value);
  }

  private evaluateCondition(
    contextValue: any,
    operator: string,
    ruleValue: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return contextValue === ruleValue;
      case "not_equals":
        return contextValue !== ruleValue;
      case "contains":
        return String(contextValue).includes(String(ruleValue));
      case "not_contains":
        return !String(contextValue).includes(String(ruleValue));
      case "in":
        return Array.isArray(ruleValue) && ruleValue.includes(contextValue);
      case "not_in":
        return Array.isArray(ruleValue) && !ruleValue.includes(contextValue);
      case "greater_than":
        return Number(contextValue) > Number(ruleValue);
      case "less_than":
        return Number(contextValue) < Number(ruleValue);
      default:
        return false;
    }
  }

  private assignVariant(experiment: Experiment, sessionId: string): string {
    // Use session ID for consistent assignment
    const hash = this.hashString(sessionId + experiment.id);
    const random = (hash % 10000) / 100; // 0-99.99

    let cumulativePercentage = 0;
    for (const variant of experiment.variants) {
      cumulativePercentage += variant.trafficSplit;
      if (random < cumulativePercentage) {
        return variant.id;
      }
    }

    // Fallback to control variant
    return (
      experiment.variants.find((v) => v.isControl)?.id ||
      experiment.variants[0].id
    );
  }

  private async storeAssignment(assignment: UserAssignment): Promise<void> {
    const assignmentId = `${assignment.experimentId}_${assignment.sessionId}`;

    await this.db
      .collection("ab_assignments")
      .doc(assignmentId)
      .set({
        ...assignment,
        assignedAt: Timestamp.fromDate(assignment.assignedAt),
      });
  }

  private calculateConversions(events: any[], goal: Goal): number {
    switch (goal.operator || "count") {
      case "count":
        return events.length;
      case "unique":
        const uniqueUsers = new Set(events.map((e) => e.userId || e.sessionId));
        return uniqueUsers.size;
      case "sum":
        return events.reduce((sum, e) => sum + (e.value || 0), 0);
      case "average":
        return events.length > 0
          ? events.reduce((sum, e) => sum + (e.value || 0), 0) / events.length
          : 0;
      default:
        return events.length;
    }
  }

  private calculateEngagementMetrics(events: any[]): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Group events by type
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return eventsByType;
  }

  private performStatisticalTest(
    variantResults: Record<string, VariantResults>,
    experiment: Experiment,
  ): StatisticalTest {
    // Simplified chi-square test for conversion rate comparison
    const variants = Object.values(variantResults);
    const controlVariant = variants.find(
      (v) => experiment.variants.find((ev) => ev.id === v.variantId)?.isControl,
    );

    if (!controlVariant || variants.length < 2) {
      return {
        testType: "chi_square",
        pValue: 1,
        confidenceInterval: [0, 0],
        effectSize: 0,
      };
    }

    // Simple chi-square calculation (would use proper statistical library in production)
    const totalParticipants = variants.reduce(
      (sum, v) => sum + v.participants,
      0,
    );
    const totalConversions = variants.reduce(
      (sum, v) => sum + v.conversions,
      0,
    );
    const expectedRate = totalConversions / totalParticipants;

    let chiSquare = 0;
    for (const variant of variants) {
      const expected = variant.participants * expectedRate;
      const observed = variant.conversions;
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }

    // Simplified p-value calculation (would use proper distribution in production)
    const pValue = chiSquare > 3.84 ? 0.05 : 0.5; // Very simplified

    const effectSize = Math.abs(
      controlVariant.conversionRate -
        variants.filter((v) => v.variantId !== controlVariant.variantId)[0]
          ?.conversionRate || 0,
    );

    return {
      testType: "chi_square",
      pValue,
      confidenceInterval: [effectSize - 0.1, effectSize + 0.1], // Simplified
      effectSize,
    };
  }

  private determineExperimentStatus(
    statisticalTest: StatisticalTest,
    variantResults: Record<string, VariantResults>,
  ): ExperimentResults["status"] {
    const totalParticipants = Object.values(variantResults).reduce(
      (sum, v) => sum + v.participants,
      0,
    );

    if (totalParticipants < 100) {
      return "insufficient_data";
    }

    if (statisticalTest.pValue > 0.05) {
      return "no_significant_difference";
    }

    return "significant_winner";
  }

  private determineWinningVariant(
    variantResults: Record<string, VariantResults>,
    statisticalTest: StatisticalTest,
  ): string | undefined {
    if (statisticalTest.pValue > 0.05) {
      return undefined;
    }

    // Find variant with highest conversion rate
    const sortedVariants = Object.values(variantResults).sort(
      (a, b) => b.conversionRate - a.conversionRate,
    );

    return sortedVariants[0]?.variantId;
  }

  private async storeExperimentResults(
    experimentId: string,
    results: ExperimentResults,
  ): Promise<void> {
    await this.db
      .collection("ab_experiments")
      .doc(experimentId)
      .update({
        results: {
          ...results,
          calculatedAt: Timestamp.fromDate(results.calculatedAt),
        },
        updatedAt: Timestamp.now(),
      });
  }

  private async updateExperimentMetrics(experimentId: string): Promise<void> {
    // Update real-time metrics (simplified)
    // In production, this might trigger a background job
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const abTestingFramework = new ABTestingFramework();
