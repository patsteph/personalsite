/**
 * Auto-scaling configuration and management
 * Integrates with cloud providers for automatic scaling
 */

export interface ScalingPolicy {
  name: string;
  resource: string;
  metric: string;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  minInstances: number;
  maxInstances: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  scaleUpStep: number;
  scaleDownStep: number;
  enabled: boolean;
}

export interface CloudProvider {
  name: string;
  region: string;
  credentials: any;
  endpoints: {
    instances: string;
    metrics: string;
    scaling: string;
  };
}

export interface ScalingEvent {
  id: string;
  policyName: string;
  action: "scale-up" | "scale-down";
  reason: string;
  beforeInstances: number;
  afterInstances: number;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
}

export interface PredictiveScalingConfig {
  enabled: boolean;
  forecastHorizon: number; // minutes
  confidenceThreshold: number;
  trainingPeriod: number; // days
  features: string[];
}

export interface AutoScalerConfig {
  provider: CloudProvider;
  policies: ScalingPolicy[];
  predictiveScaling: PredictiveScalingConfig;
  globalCooldown: number;
  maxScalingEvents: number;
  emergencyMode: {
    enabled: boolean;
    cpuThreshold: number;
    memoryThreshold: number;
    responseTimeThreshold: number;
  };
}

export class AutoScaler {
  private scalingEvents: ScalingEvent[] = [];
  private activeCooldowns: Map<string, number> = new Map();
  private lastGlobalScaling = 0;
  private emergencyModeActive = false;
  private predictionCache: Map<string, any> = new Map();

  constructor(private config: AutoScalerConfig) {}

  /**
   * Evaluate all scaling policies and execute if needed
   */
  async evaluateScaling(metrics: any): Promise<ScalingEvent[]> {
    const events: ScalingEvent[] = [];
    const now = Date.now();

    // Check global cooldown
    if (now - this.lastGlobalScaling < this.config.globalCooldown) {
      return events;
    }

    // Check emergency mode
    await this.checkEmergencyMode(metrics);

    // Evaluate each policy
    for (const policy of this.config.policies) {
      if (!policy.enabled) continue;

      const event = await this.evaluatePolicy(policy, metrics);
      if (event) {
        events.push(event);
        this.lastGlobalScaling = now;
      }
    }

    // Predictive scaling
    if (this.config.predictiveScaling.enabled) {
      const predictiveEvents = await this.evaluatePredictiveScaling(metrics);
      events.push(...predictiveEvents);
    }

    return events;
  }

  /**
   * Add a new scaling policy
   */
  addPolicy(policy: ScalingPolicy): void {
    // Validate policy
    this.validatePolicy(policy);

    // Remove existing policy with same name
    this.config.policies = this.config.policies.filter(
      (p) => p.name !== policy.name,
    );

    // Add new policy
    this.config.policies.push(policy);
  }

  /**
   * Remove a scaling policy
   */
  removePolicy(policyName: string): boolean {
    const initialLength = this.config.policies.length;
    this.config.policies = this.config.policies.filter(
      (p) => p.name !== policyName,
    );
    return this.config.policies.length < initialLength;
  }

  /**
   * Get scaling history
   */
  getScalingHistory(timeRange?: number): ScalingEvent[] {
    if (!timeRange) return [...this.scalingEvents];

    const cutoff = Date.now() - timeRange;
    return this.scalingEvents.filter((event) => event.timestamp > cutoff);
  }

  /**
   * Get scaling recommendations without executing
   */
  async getScalingRecommendations(metrics: any): Promise<
    Array<{
      policy: string;
      action: "scale-up" | "scale-down" | "no-change";
      currentValue: number;
      threshold: number;
      confidence: number;
      reason: string;
    }>
  > {
    const recommendations = [];

    for (const policy of this.config.policies) {
      const metricValue = this.getMetricValue(metrics, policy.metric);
      const currentInstances = await this.getCurrentInstances(policy.resource);

      let action: "scale-up" | "scale-down" | "no-change" = "no-change";
      let threshold = 0;
      let confidence = 0;
      let reason = "";

      if (
        metricValue > policy.scaleUpThreshold &&
        currentInstances < policy.maxInstances
      ) {
        action = "scale-up";
        threshold = policy.scaleUpThreshold;
        confidence = Math.min(1, (metricValue - threshold) / threshold);
        reason = `${policy.metric} (${metricValue}) exceeds scale-up threshold (${threshold})`;
      } else if (
        metricValue < policy.scaleDownThreshold &&
        currentInstances > policy.minInstances
      ) {
        action = "scale-down";
        threshold = policy.scaleDownThreshold;
        confidence = Math.min(1, (threshold - metricValue) / threshold);
        reason = `${policy.metric} (${metricValue}) below scale-down threshold (${threshold})`;
      } else {
        reason = `${policy.metric} (${metricValue}) within normal range`;
      }

      recommendations.push({
        policy: policy.name,
        action,
        currentValue: metricValue,
        threshold,
        confidence,
        reason,
      });
    }

    return recommendations;
  }

  /**
   * Force scaling action (manual override)
   */
  async forceScaling(
    policyName: string,
    action: "scale-up" | "scale-down",
    instances?: number,
  ): Promise<ScalingEvent> {
    const policy = this.config.policies.find((p) => p.name === policyName);
    if (!policy) {
      throw new Error(`Policy ${policyName} not found`);
    }

    const currentInstances = await this.getCurrentInstances(policy.resource);
    const targetInstances =
      instances ||
      (action === "scale-up"
        ? Math.min(policy.maxInstances, currentInstances + policy.scaleUpStep)
        : Math.max(
            policy.minInstances,
            currentInstances - policy.scaleDownStep,
          ));

    return this.executeScaling(
      policy,
      action,
      currentInstances,
      targetInstances,
      "Manual override",
    );
  }

  /**
   * Get current auto-scaler status
   */
  getStatus(): {
    policies: Array<
      ScalingPolicy & {
        currentInstances: Promise<number>;
        cooldownRemaining: number;
        lastEvent?: ScalingEvent;
      }
    >;
    emergencyMode: boolean;
    recentEvents: ScalingEvent[];
    predictions?: any;
  } {
    const recentEvents = this.getScalingHistory(24 * 60 * 60 * 1000); // Last 24 hours

    const policies = this.config.policies.map((policy) => {
      const cooldownKey = `${policy.name}-${policy.resource}`;
      const lastCooldown = this.activeCooldowns.get(cooldownKey) || 0;
      const cooldownRemaining = Math.max(0, lastCooldown - Date.now());
      const lastEvent = recentEvents
        .filter((e) => e.policyName === policy.name)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return {
        ...policy,
        currentInstances: this.getCurrentInstances(policy.resource),
        cooldownRemaining,
        lastEvent,
      };
    });

    return {
      policies,
      emergencyMode: this.emergencyModeActive,
      recentEvents: recentEvents.slice(0, 10),
      predictions: this.config.predictiveScaling.enabled
        ? this.predictionCache
        : undefined,
    };
  }

  /**
   * Simulate scaling scenarios
   */
  async simulateScaling(
    scenarios: Array<{
      name: string;
      metrics: any;
      duration: number; // minutes
    }>,
  ): Promise<
    Array<{
      scenario: string;
      events: ScalingEvent[];
      finalInstances: Record<string, number>;
      cost: number;
      performance: {
        avgResponseTime: number;
        errorRate: number;
      };
    }>
  > {
    const results = [];

    for (const scenario of scenarios) {
      const events: ScalingEvent[] = [];
      const instanceCounts: Record<string, number> = {};

      // Initialize instance counts
      for (const policy of this.config.policies) {
        instanceCounts[policy.resource] = await this.getCurrentInstances(
          policy.resource,
        );
      }

      // Simulate scaling over time
      const steps = Math.ceil(scenario.duration / 5); // 5-minute intervals
      for (let step = 0; step < steps; step++) {
        const stepEvents = await this.evaluateScaling(scenario.metrics);
        events.push(...stepEvents);

        // Update instance counts
        for (const event of stepEvents) {
          if (event.success) {
            instanceCounts[event.policyName] = event.afterInstances;
          }
        }
      }

      // Calculate cost and performance
      const cost = this.calculateCost(instanceCounts, scenario.duration);
      const performance = this.calculatePerformance(
        instanceCounts,
        scenario.metrics,
      );

      results.push({
        scenario: scenario.name,
        events,
        finalInstances: instanceCounts,
        cost,
        performance,
      });
    }

    return results;
  }

  private async evaluatePolicy(
    policy: ScalingPolicy,
    metrics: any,
  ): Promise<ScalingEvent | null> {
    const metricValue = this.getMetricValue(metrics, policy.metric);
    const currentInstances = await this.getCurrentInstances(policy.resource);

    // Check cooldowns
    const cooldownKey = `${policy.name}-${policy.resource}`;
    const lastCooldown = this.activeCooldowns.get(cooldownKey) || 0;
    if (Date.now() - lastCooldown < policy.scaleUpCooldown) {
      return null;
    }

    let shouldScale = false;
    let action: "scale-up" | "scale-down" = "scale-up";
    let targetInstances = currentInstances;
    let reason = "";

    // Check scale-up conditions
    if (
      metricValue > policy.scaleUpThreshold &&
      currentInstances < policy.maxInstances
    ) {
      shouldScale = true;
      action = "scale-up";
      targetInstances = Math.min(
        policy.maxInstances,
        currentInstances + policy.scaleUpStep,
      );
      reason = `${policy.metric} (${metricValue}) > threshold (${policy.scaleUpThreshold})`;
    }
    // Check scale-down conditions
    else if (
      metricValue < policy.scaleDownThreshold &&
      currentInstances > policy.minInstances
    ) {
      // Additional check for scale-down cooldown
      if (Date.now() - lastCooldown < policy.scaleDownCooldown) {
        return null;
      }

      shouldScale = true;
      action = "scale-down";
      targetInstances = Math.max(
        policy.minInstances,
        currentInstances - policy.scaleDownStep,
      );
      reason = `${policy.metric} (${metricValue}) < threshold (${policy.scaleDownThreshold})`;
    }

    if (!shouldScale) {
      return null;
    }

    return this.executeScaling(
      policy,
      action,
      currentInstances,
      targetInstances,
      reason,
    );
  }

  private async executeScaling(
    policy: ScalingPolicy,
    action: "scale-up" | "scale-down",
    currentInstances: number,
    targetInstances: number,
    reason: string,
  ): Promise<ScalingEvent> {
    const startTime = Date.now();
    const event: ScalingEvent = {
      id: this.generateEventId(),
      policyName: policy.name,
      action,
      reason,
      beforeInstances: currentInstances,
      afterInstances: targetInstances,
      timestamp: startTime,
      duration: 0,
      success: false,
    };

    try {
      // Execute scaling via cloud provider API
      await this.callCloudProviderAPI(policy.resource, targetInstances);

      event.success = true;
      event.duration = Date.now() - startTime;

      // Set cooldown
      const cooldownKey = `${policy.name}-${policy.resource}`;
      const cooldownDuration =
        action === "scale-up"
          ? policy.scaleUpCooldown
          : policy.scaleDownCooldown;
      this.activeCooldowns.set(cooldownKey, Date.now() + cooldownDuration);
    } catch (error) {
      event.success = false;
      event.error = error instanceof Error ? error.message : String(error);
      event.duration = Date.now() - startTime;
    }

    this.scalingEvents.push(event);
    return event;
  }

  private async checkEmergencyMode(metrics: any): Promise<void> {
    if (!this.config.emergencyMode.enabled) return;

    const cpu = this.getMetricValue(metrics, "cpu.usage");
    const memory = this.getMetricValue(metrics, "memory.percentage");
    const responseTime = this.getMetricValue(
      metrics,
      "application.averageResponseTime",
    );

    const isEmergency =
      cpu > this.config.emergencyMode.cpuThreshold ||
      memory > this.config.emergencyMode.memoryThreshold ||
      responseTime > this.config.emergencyMode.responseTimeThreshold;

    if (isEmergency && !this.emergencyModeActive) {
      this.emergencyModeActive = true;
      console.warn("Emergency scaling mode activated");

      // Trigger emergency scaling for all resources
      for (const policy of this.config.policies) {
        const currentInstances = await this.getCurrentInstances(
          policy.resource,
        );
        if (currentInstances < policy.maxInstances) {
          await this.executeScaling(
            policy,
            "scale-up",
            currentInstances,
            Math.min(policy.maxInstances, currentInstances + 2),
            "Emergency scaling triggered",
          );
        }
      }
    } else if (!isEmergency && this.emergencyModeActive) {
      this.emergencyModeActive = false;
      console.log("Emergency scaling mode deactivated");
    }
  }

  private async evaluatePredictiveScaling(
    metrics: any,
  ): Promise<ScalingEvent[]> {
    // Simplified predictive scaling - in production this would use ML models
    const events: ScalingEvent[] = [];

    // Get historical data for prediction
    const historicalMetrics = this.getHistoricalMetrics(
      this.config.predictiveScaling.trainingPeriod,
    );

    // Simple trend-based prediction
    for (const policy of this.config.policies) {
      const prediction = this.predictMetric(policy.metric, historicalMetrics);

      if (
        prediction.confidence >
        this.config.predictiveScaling.confidenceThreshold
      ) {
        const currentInstances = await this.getCurrentInstances(
          policy.resource,
        );

        if (
          prediction.futureValue > policy.scaleUpThreshold &&
          currentInstances < policy.maxInstances
        ) {
          const event = await this.executeScaling(
            policy,
            "scale-up",
            currentInstances,
            Math.min(policy.maxInstances, currentInstances + 1),
            `Predictive scaling: ${policy.metric} predicted to reach ${prediction.futureValue}`,
          );
          events.push(event);
        }
      }
    }

    return events;
  }

  private getMetricValue(metrics: any, metricPath: string): number {
    const parts = metricPath.split(".");
    let value = metrics;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === "number" ? value : 0;
  }

  private async getCurrentInstances(resource: string): Promise<number> {
    // In production, this would query cloud provider APIs
    return 2; // Default value
  }

  private async callCloudProviderAPI(
    resource: string,
    targetInstances: number,
  ): Promise<void> {
    // In production, this would make actual API calls to AWS, GCP, Azure, etc.
    console.log(`Scaling ${resource} to ${targetInstances} instances`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private validatePolicy(policy: ScalingPolicy): void {
    if (policy.scaleUpThreshold <= policy.scaleDownThreshold) {
      throw new Error(
        "Scale-up threshold must be greater than scale-down threshold",
      );
    }

    if (policy.minInstances < 0 || policy.maxInstances < policy.minInstances) {
      throw new Error("Invalid instance count configuration");
    }

    if (policy.scaleUpStep < 1 || policy.scaleDownStep < 1) {
      throw new Error("Scaling steps must be at least 1");
    }
  }

  private getHistoricalMetrics(days: number): any[] {
    // In production, this would fetch from monitoring system
    return [];
  }

  private predictMetric(
    metric: string,
    historicalData: any[],
  ): {
    futureValue: number;
    confidence: number;
  } {
    // Simplified prediction - in production use proper ML models
    if (historicalData.length < 10) {
      return { futureValue: 0, confidence: 0 };
    }

    const recent = historicalData.slice(-5);
    const trend =
      recent.reduce((sum, val, idx) => sum + val * (idx + 1), 0) /
      recent.length;

    return {
      futureValue: trend * 1.1, // Simple 10% increase prediction
      confidence: 0.7,
    };
  }

  private calculateCost(
    instanceCounts: Record<string, number>,
    duration: number,
  ): number {
    // Simplified cost calculation
    const hourlyRates: Record<string, number> = {
      "web-servers": 0.1,
      "api-servers": 0.15,
      database: 0.3,
    };

    const hours = duration / 60;
    let totalCost = 0;

    for (const [resource, instances] of Object.entries(instanceCounts)) {
      const rate = hourlyRates[resource] || 0.1;
      totalCost += instances * rate * hours;
    }

    return totalCost;
  }

  private calculatePerformance(
    instanceCounts: Record<string, number>,
    metrics: any,
  ): { avgResponseTime: number; errorRate: number } {
    // Simplified performance calculation
    const totalInstances = Object.values(instanceCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      avgResponseTime: Math.max(100, 1000 / totalInstances),
      errorRate: Math.max(0.1, 5 / totalInstances),
    };
  }

  private generateEventId(): string {
    return `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Factory for creating auto-scalers
export class AutoScalerFactory {
  static createWebAppScaler(provider: CloudProvider): AutoScaler {
    return new AutoScaler({
      provider,
      policies: [
        {
          name: "web-cpu-scaling",
          resource: "web-servers",
          metric: "cpu.usage",
          scaleUpThreshold: 70,
          scaleDownThreshold: 30,
          minInstances: 2,
          maxInstances: 10,
          scaleUpCooldown: 5 * 60 * 1000, // 5 minutes
          scaleDownCooldown: 10 * 60 * 1000, // 10 minutes
          scaleUpStep: 2,
          scaleDownStep: 1,
          enabled: true,
        },
        {
          name: "web-response-time-scaling",
          resource: "web-servers",
          metric: "application.averageResponseTime",
          scaleUpThreshold: 1000,
          scaleDownThreshold: 200,
          minInstances: 2,
          maxInstances: 10,
          scaleUpCooldown: 3 * 60 * 1000, // 3 minutes
          scaleDownCooldown: 15 * 60 * 1000, // 15 minutes
          scaleUpStep: 1,
          scaleDownStep: 1,
          enabled: true,
        },
      ],
      predictiveScaling: {
        enabled: false,
        forecastHorizon: 30,
        confidenceThreshold: 0.8,
        trainingPeriod: 7,
        features: [
          "cpu.usage",
          "memory.percentage",
          "application.requestsPerSecond",
        ],
      },
      globalCooldown: 2 * 60 * 1000, // 2 minutes
      maxScalingEvents: 10,
      emergencyMode: {
        enabled: true,
        cpuThreshold: 90,
        memoryThreshold: 95,
        responseTimeThreshold: 5000,
      },
    });
  }
}

// Default configuration templates
export const defaultScalingPolicies = {
  cpu: {
    scaleUpThreshold: 70,
    scaleDownThreshold: 30,
    minInstances: 2,
    maxInstances: 10,
  },
  memory: {
    scaleUpThreshold: 80,
    scaleDownThreshold: 40,
    minInstances: 2,
    maxInstances: 8,
  },
  responseTime: {
    scaleUpThreshold: 1000,
    scaleDownThreshold: 200,
    minInstances: 2,
    maxInstances: 12,
  },
};
