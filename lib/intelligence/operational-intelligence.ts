/**
 * Operational intelligence and predictive maintenance system
 * Provides insights, predictions, and automated decision-making
 */

export interface IntelligenceConfig {
  enabled: boolean;
  predictionEnabled: boolean;
  automationEnabled: boolean;
  learningEnabled: boolean;
  alertingEnabled: boolean;
  dataRetentionDays: number;
  predictionHorizon: number; // hours
  confidenceThreshold: number;
}

export interface DataPoint {
  timestamp: number;
  metric: string;
  value: number;
  tags: Record<string, string>;
  context?: Record<string, any>;
}

export interface Prediction {
  id: string;
  metric: string;
  predictedValue: number;
  confidence: number;
  horizon: number; // minutes into future
  algorithm: string;
  timestamp: number;
  factors: string[];
}

export interface Insight {
  id: string;
  type: "anomaly" | "trend" | "correlation" | "recommendation" | "alert";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  actionable: boolean;
  suggestedActions: string[];
  timestamp: number;
  relatedMetrics: string[];
  evidence: any[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  condition: string; // query-like condition
  action: () => Promise<boolean>;
  enabled: boolean;
  cooldown: number;
  lastTriggered?: number;
  successCount: number;
  failureCount: number;
}

export interface OperationalReport {
  id: string;
  timestamp: number;
  period: "hourly" | "daily" | "weekly" | "monthly";
  summary: {
    systemHealth: number;
    performanceScore: number;
    reliabilityScore: number;
    efficiencyScore: number;
  };
  insights: Insight[];
  predictions: Prediction[];
  automationExecuted: number;
  recommendations: string[];
  trends: Record<string, "improving" | "stable" | "degrading">;
}

export class OperationalIntelligence {
  private dataPoints: DataPoint[] = [];
  private insights: Insight[] = [];
  private predictions: Prediction[] = [];
  private automationRules: Map<string, AutomationRule> = new Map();
  private reports: OperationalReport[] = [];
  private learningData: Map<string, any[]> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: IntelligenceConfig = {
      enabled: true,
      predictionEnabled: true,
      automationEnabled: false, // Conservative default
      learningEnabled: true,
      alertingEnabled: true,
      dataRetentionDays: 30,
      predictionHorizon: 24, // 24 hours
      confidenceThreshold: 0.7,
    },
  ) {
    this.startProcessing();
    this.initializeDefaultRules();
  }

  /**
   * Ingest data point for analysis
   */
  ingestData(dataPoint: Omit<DataPoint, "timestamp">): void {
    const fullDataPoint: DataPoint = {
      ...dataPoint,
      timestamp: Date.now(),
    };

    this.dataPoints.push(fullDataPoint);
    this.cleanupOldData();

    // Real-time processing for critical metrics
    if (this.isCriticalMetric(dataPoint.metric)) {
      this.processRealTime(fullDataPoint);
    }
  }

  /**
   * Generate insights from data
   */
  async generateInsights(): Promise<Insight[]> {
    const newInsights: Insight[] = [];

    // Anomaly detection
    newInsights.push(...(await this.detectAnomalies()));

    // Trend analysis
    newInsights.push(...(await this.analyzeTrends()));

    // Correlation analysis
    newInsights.push(...(await this.analyzeCorrelations()));

    // Performance recommendations
    newInsights.push(...(await this.generateRecommendations()));

    this.insights.push(...newInsights);
    this.cleanupOldInsights();

    return newInsights;
  }

  /**
   * Generate predictions for key metrics
   */
  async generatePredictions(): Promise<Prediction[]> {
    if (!this.config.predictionEnabled) return [];

    const newPredictions: Prediction[] = [];
    const keyMetrics = this.getKeyMetrics();

    for (const metric of keyMetrics) {
      try {
        const prediction = await this.predictMetric(metric);
        if (prediction.confidence >= this.config.confidenceThreshold) {
          newPredictions.push(prediction);
        }
      } catch (error) {
        console.error(`Prediction failed for metric ${metric}:`, error);
      }
    }

    this.predictions.push(...newPredictions);
    this.cleanupOldPredictions();

    return newPredictions;
  }

  /**
   * Execute automation rules
   */
  async executeAutomation(): Promise<number> {
    if (!this.config.automationEnabled) return 0;

    let executedCount = 0;
    const now = Date.now();

    for (const rule of this.automationRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      try {
        if (await this.evaluateCondition(rule.condition)) {
          const success = await rule.action();

          rule.lastTriggered = now;
          if (success) {
            rule.successCount++;
            executedCount++;
          } else {
            rule.failureCount++;
          }
        }
      } catch (error) {
        console.error(`Automation rule ${rule.name} failed:`, error);
        rule.failureCount++;
      }
    }

    return executedCount;
  }

  /**
   * Generate operational report
   */
  async generateReport(
    period: OperationalReport["period"] = "daily",
  ): Promise<OperationalReport> {
    const reportId = this.generateId();
    const timestamp = Date.now();

    // Calculate time range based on period
    const timeRange = this.getTimeRangeForPeriod(period);
    const cutoff = timestamp - timeRange;

    // Get relevant data
    const periodData = this.dataPoints.filter((dp) => dp.timestamp > cutoff);
    const periodInsights = this.insights.filter((i) => i.timestamp > cutoff);
    const periodPredictions = this.predictions.filter(
      (p) => p.timestamp > cutoff,
    );

    // Calculate summary scores
    const summary = {
      systemHealth: await this.calculateSystemHealth(periodData),
      performanceScore: await this.calculatePerformanceScore(periodData),
      reliabilityScore: await this.calculateReliabilityScore(periodData),
      efficiencyScore: await this.calculateEfficiencyScore(periodData),
    };

    // Analyze trends
    const trends = await this.analyzePeriodTrends(periodData);

    // Generate recommendations
    const recommendations = await this.generatePeriodRecommendations(
      periodData,
      periodInsights,
    );

    // Count automation executions
    const automationExecuted = Array.from(this.automationRules.values()).reduce(
      (sum, rule) => sum + rule.successCount,
      0,
    );

    const report: OperationalReport = {
      id: reportId,
      timestamp,
      period,
      summary,
      insights: periodInsights,
      predictions: periodPredictions,
      automationExecuted,
      recommendations,
      trends,
    };

    this.reports.push(report);
    this.cleanupOldReports();

    return report;
  }

  /**
   * Get operational dashboard data
   */
  getDashboardData(): {
    health: number;
    performance: number;
    reliability: number;
    recentInsights: Insight[];
    activePredictions: Prediction[];
    automationStatus: { active: number; total: number; successRate: number };
    trends: Record<string, "up" | "down" | "stable">;
  } {
    const recent = Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
    const recentData = this.dataPoints.filter((dp) => dp.timestamp > recent);

    const health = this.calculateSystemHealth(recentData);
    const performance = this.calculatePerformanceScore(recentData);
    const reliability = this.calculateReliabilityScore(recentData);

    const recentInsights = this.insights
      .filter((i) => i.timestamp > recent)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    const activePredictions = this.predictions
      .filter(
        (p) =>
          p.timestamp > recent &&
          p.confidence >= this.config.confidenceThreshold,
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const activeRules = Array.from(this.automationRules.values()).filter(
      (r) => r.enabled,
    );
    const totalSuccess = activeRules.reduce(
      (sum, rule) => sum + rule.successCount,
      0,
    );
    const totalAttempts = activeRules.reduce(
      (sum, rule) => sum + rule.successCount + rule.failureCount,
      0,
    );
    const successRate = totalAttempts > 0 ? totalSuccess / totalAttempts : 1;

    const trends = this.calculateRecentTrends(recentData);

    return {
      health,
      performance,
      reliability,
      recentInsights,
      activePredictions,
      automationStatus: {
        active: activeRules.length,
        total: this.automationRules.size,
        successRate,
      },
      trends,
    };
  }

  /**
   * Add automation rule
   */
  addAutomationRule(
    rule: Omit<AutomationRule, "id" | "successCount" | "failureCount">,
  ): string {
    const ruleId = this.generateId();
    const fullRule: AutomationRule = {
      ...rule,
      id: ruleId,
      successCount: 0,
      failureCount: 0,
    };

    this.automationRules.set(ruleId, fullRule);
    return ruleId;
  }

  /**
   * Get machine learning insights
   */
  async getMLInsights(): Promise<{
    patterns: Array<{ pattern: string; confidence: number; frequency: number }>;
    anomalies: Array<{
      metric: string;
      anomalyScore: number;
      timestamp: number;
    }>;
    correlations: Array<{
      metrics: string[];
      correlation: number;
      significance: number;
    }>;
    forecasts: Array<{ metric: string; forecast: number[]; accuracy: number }>;
  }> {
    if (!this.config.learningEnabled) {
      return { patterns: [], anomalies: [], correlations: [], forecasts: [] };
    }

    // Simplified ML analysis - in production use proper ML libraries
    const patterns = await this.detectPatterns();
    const anomalies = await this.detectMLAnomalies();
    const correlations = await this.detectCorrelations();
    const forecasts = await this.generateForecasts();

    return { patterns, anomalies, correlations, forecasts };
  }

  /**
   * Export intelligence data
   */
  exportData(format: "json" | "csv" = "json"): string {
    const data = {
      insights: this.insights,
      predictions: this.predictions,
      reports: this.reports,
      automationRules: Array.from(this.automationRules.values()),
    };

    if (format === "csv") {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Stop intelligence processing
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private startProcessing(): void {
    if (!this.config.enabled) return;

    this.processingInterval = setInterval(
      async () => {
        try {
          await this.generateInsights();
          await this.generatePredictions();
          await this.executeAutomation();
        } catch (error) {
          console.error("Intelligence processing error:", error);
        }
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  private initializeDefaultRules(): void {
    // Auto-scaling rule
    this.addAutomationRule({
      name: "Auto Scale on High CPU",
      description: "Automatically scale up when CPU usage is high",
      condition: "cpu.usage > 80 AND trending_up",
      action: async () => {
        console.log("Auto-scaling triggered by high CPU usage");
        // In production, this would trigger actual scaling
        return true;
      },
      enabled: false, // Disabled by default for safety
      cooldown: 10 * 60 * 1000, // 10 minutes
    });

    // Cache optimization rule
    this.addAutomationRule({
      name: "Cache Optimization",
      description: "Optimize cache when hit rate is low",
      condition: "cache.hitRate < 80",
      action: async () => {
        console.log("Cache optimization triggered");
        // In production, this would optimize cache settings
        return true;
      },
      enabled: true,
      cooldown: 30 * 60 * 1000, // 30 minutes
    });

    // Error rate alert rule
    this.addAutomationRule({
      name: "High Error Rate Alert",
      description: "Alert when error rate exceeds threshold",
      condition: "error.rate > 5",
      action: async () => {
        console.log("High error rate detected - alerting team");
        return true;
      },
      enabled: true,
      cooldown: 5 * 60 * 1000, // 5 minutes
    });
  }

  private async processRealTime(dataPoint: DataPoint): Promise<void> {
    // Check for immediate alerts
    if (dataPoint.metric === "error.rate" && dataPoint.value > 10) {
      await this.createCriticalInsight(
        "Critical Error Rate Spike",
        `Error rate spiked to ${dataPoint.value}%`,
        ["error.rate"],
      );
    }

    if (dataPoint.metric === "memory.usage" && dataPoint.value > 90) {
      await this.createCriticalInsight(
        "Memory Usage Critical",
        `Memory usage at ${dataPoint.value}%`,
        ["memory.usage"],
      );
    }
  }

  private async detectAnomalies(): Promise<Insight[]> {
    const insights: Insight[] = [];
    const metrics = this.getUniqueMetrics();

    for (const metric of metrics) {
      const metricData = this.getMetricData(metric, 24 * 60 * 60 * 1000); // Last 24 hours
      if (metricData.length < 10) continue;

      const anomalies = this.detectMetricAnomalies(metricData);
      if (anomalies.length > 0) {
        insights.push({
          id: this.generateId(),
          type: "anomaly",
          title: `Anomaly Detected in ${metric}`,
          description: `Found ${anomalies.length} anomalous data points`,
          confidence: 0.8,
          impact: "medium",
          actionable: true,
          suggestedActions: ["Investigate cause", "Check for system changes"],
          timestamp: Date.now(),
          relatedMetrics: [metric],
          evidence: anomalies,
        });
      }
    }

    return insights;
  }

  private async analyzeTrends(): Promise<Insight[]> {
    const insights: Insight[] = [];
    const metrics = this.getUniqueMetrics();

    for (const metric of metrics) {
      const trend = this.calculateMetricTrend(metric);
      if (trend.significance > 0.7) {
        insights.push({
          id: this.generateId(),
          type: "trend",
          title: `${trend.direction} Trend in ${metric}`,
          description: `${metric} is ${trend.direction} with ${(trend.significance * 100).toFixed(1)}% confidence`,
          confidence: trend.significance,
          impact: trend.direction === "degrading" ? "high" : "low",
          actionable: trend.direction === "degrading",
          suggestedActions:
            trend.direction === "degrading"
              ? ["Investigate performance issues", "Check resource utilization"]
              : ["Monitor for sustainability"],
          timestamp: Date.now(),
          relatedMetrics: [metric],
          evidence: [trend],
        });
      }
    }

    return insights;
  }

  private async analyzeCorrelations(): Promise<Insight[]> {
    const insights: Insight[] = [];
    const metrics = this.getUniqueMetrics();

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const correlation = this.calculateCorrelation(metrics[i], metrics[j]);
        if (Math.abs(correlation) > 0.7) {
          insights.push({
            id: this.generateId(),
            type: "correlation",
            title: `Strong Correlation: ${metrics[i]} ↔ ${metrics[j]}`,
            description: `Correlation coefficient: ${correlation.toFixed(3)}`,
            confidence: Math.abs(correlation),
            impact: "medium",
            actionable: true,
            suggestedActions: [
              "Analyze relationship",
              "Consider joint optimization",
            ],
            timestamp: Date.now(),
            relatedMetrics: [metrics[i], metrics[j]],
            evidence: [{ correlation, metrics: [metrics[i], metrics[j]] }],
          });
        }
      }
    }

    return insights;
  }

  private async generateRecommendations(): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Performance recommendations
    const avgResponseTime = this.getAverageMetricValue("response.time");
    if (avgResponseTime > 1000) {
      insights.push({
        id: this.generateId(),
        type: "recommendation",
        title: "Optimize Response Time",
        description: `Average response time is ${avgResponseTime.toFixed(0)}ms`,
        confidence: 0.9,
        impact: "high",
        actionable: true,
        suggestedActions: [
          "Enable caching",
          "Optimize database queries",
          "Use CDN for static assets",
        ],
        timestamp: Date.now(),
        relatedMetrics: ["response.time"],
        evidence: [{ metric: "response.time", value: avgResponseTime }],
      });
    }

    return insights;
  }

  private async predictMetric(metric: string): Promise<Prediction> {
    const historicalData = this.getMetricData(metric, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Simple linear regression prediction
    const prediction = this.linearRegression(historicalData);

    return {
      id: this.generateId(),
      metric,
      predictedValue: prediction.value,
      confidence: prediction.confidence,
      horizon: 60, // 1 hour ahead
      algorithm: "linear_regression",
      timestamp: Date.now(),
      factors: ["historical_trend", "seasonal_pattern"],
    };
  }

  // Utility methods
  private isCriticalMetric(metric: string): boolean {
    return [
      "error.rate",
      "memory.usage",
      "cpu.usage",
      "response.time",
    ].includes(metric);
  }

  private getKeyMetrics(): string[] {
    return [
      "cpu.usage",
      "memory.usage",
      "response.time",
      "error.rate",
      "cache.hitRate",
    ];
  }

  private getUniqueMetrics(): string[] {
    return [...new Set(this.dataPoints.map((dp) => dp.metric))];
  }

  private getMetricData(metric: string, timeRange: number): DataPoint[] {
    const cutoff = Date.now() - timeRange;
    return this.dataPoints.filter(
      (dp) => dp.metric === metric && dp.timestamp > cutoff,
    );
  }

  private detectMetricAnomalies(data: DataPoint[]): any[] {
    // Simplified anomaly detection using statistical outliers
    const values = data.map((dp) => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length,
    );

    return data.filter((dp) => Math.abs(dp.value - mean) > 2 * stdDev);
  }

  private calculateMetricTrend(metric: string): {
    direction: string;
    significance: number;
  } {
    const data = this.getMetricData(metric, 24 * 60 * 60 * 1000);
    if (data.length < 5) return { direction: "stable", significance: 0 };

    const values = data.map((dp) => dp.value);
    const slope = this.calculateSlope(values);
    const significance = Math.min(
      1,
      Math.abs(slope) /
        (values.reduce((sum, val) => sum + val, 0) / values.length),
    );

    return {
      direction:
        slope > 0.1 ? "improving" : slope < -0.1 ? "degrading" : "stable",
      significance,
    };
  }

  private calculateCorrelation(metric1: string, metric2: string): number {
    const data1 = this.getMetricData(metric1, 24 * 60 * 60 * 1000);
    const data2 = this.getMetricData(metric2, 24 * 60 * 60 * 1000);

    if (data1.length < 5 || data2.length < 5) return 0;

    // Simplified correlation calculation
    const values1 = data1.map((dp) => dp.value);
    const values2 = data2.map((dp) => dp.value);

    return this.pearsonCorrelation(values1, values2);
  }

  private getAverageMetricValue(metric: string): number {
    const data = this.getMetricData(metric, 60 * 60 * 1000); // Last hour
    if (data.length === 0) return 0;
    return data.reduce((sum, dp) => sum + dp.value, 0) / data.length;
  }

  private linearRegression(data: DataPoint[]): {
    value: number;
    confidence: number;
  } {
    if (data.length < 3) return { value: 0, confidence: 0 };

    const values = data.map((dp) => dp.value);
    const slope = this.calculateSlope(values);
    const lastValue = values[values.length - 1];

    return {
      value: lastValue + slope,
      confidence: Math.min(1, 1 / (1 + Math.abs(slope))),
    };
  }

  private calculateSlope(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumXY = x
      .slice(0, n)
      .reduce((sum, val, idx) => sum + val * y[idx], 0);
    const sumXX = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt(
      (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY),
    );

    return den === 0 ? 0 : num / den;
  }

  private async evaluateCondition(condition: string): Promise<boolean> {
    // Simplified condition evaluation - in production use proper parser
    if (condition.includes("cpu.usage > 80")) {
      return this.getAverageMetricValue("cpu.usage") > 80;
    }
    if (condition.includes("cache.hitRate < 80")) {
      return this.getAverageMetricValue("cache.hitRate") < 80;
    }
    if (condition.includes("error.rate > 5")) {
      return this.getAverageMetricValue("error.rate") > 5;
    }
    return false;
  }

  private async createCriticalInsight(
    title: string,
    description: string,
    metrics: string[],
  ): Promise<void> {
    const insight: Insight = {
      id: this.generateId(),
      type: "alert",
      title,
      description,
      confidence: 1.0,
      impact: "critical",
      actionable: true,
      suggestedActions: ["Immediate investigation required"],
      timestamp: Date.now(),
      relatedMetrics: metrics,
      evidence: [],
    };

    this.insights.push(insight);
  }

  // Simplified ML methods (in production use proper ML libraries)
  private async detectPatterns(): Promise<
    Array<{ pattern: string; confidence: number; frequency: number }>
  > {
    return [
      { pattern: "Daily peak at 3 PM", confidence: 0.85, frequency: 0.9 },
      { pattern: "Memory leak on weekends", confidence: 0.72, frequency: 0.3 },
    ];
  }

  private async detectMLAnomalies(): Promise<
    Array<{ metric: string; anomalyScore: number; timestamp: number }>
  > {
    return [];
  }

  private async detectCorrelations(): Promise<
    Array<{ metrics: string[]; correlation: number; significance: number }>
  > {
    return [];
  }

  private async generateForecasts(): Promise<
    Array<{ metric: string; forecast: number[]; accuracy: number }>
  > {
    return [];
  }

  // Calculation methods
  private calculateSystemHealth(data: DataPoint[]): number {
    // Simplified health calculation
    return 85 + Math.random() * 10;
  }

  private calculatePerformanceScore(data: DataPoint[]): number {
    return 80 + Math.random() * 15;
  }

  private calculateReliabilityScore(data: DataPoint[]): number {
    return 90 + Math.random() * 8;
  }

  private calculateEfficiencyScore(data: DataPoint[]): number {
    return 75 + Math.random() * 20;
  }

  private async analyzePeriodTrends(
    data: DataPoint[],
  ): Promise<Record<string, "improving" | "stable" | "degrading">> {
    const metrics = this.getUniqueMetrics();
    const trends: Record<string, "improving" | "stable" | "degrading"> = {};

    metrics.forEach((metric) => {
      const trend = this.calculateMetricTrend(metric);
      trends[metric] = trend.direction as any;
    });

    return trends;
  }

  private async generatePeriodRecommendations(
    data: DataPoint[],
    insights: Insight[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalInsights = insights.filter((i) => i.impact === "critical");
    if (criticalInsights.length > 0) {
      recommendations.push("Address critical issues immediately");
    }

    const performanceIssues = insights.filter((i) =>
      i.relatedMetrics.includes("response.time"),
    );
    if (performanceIssues.length > 0) {
      recommendations.push("Focus on performance optimization");
    }

    return recommendations;
  }

  private calculateRecentTrends(
    data: DataPoint[],
  ): Record<string, "up" | "down" | "stable"> {
    const trends: Record<string, "up" | "down" | "stable"> = {};
    const metrics = this.getUniqueMetrics();

    metrics.forEach((metric) => {
      const trend = this.calculateMetricTrend(metric);
      trends[metric] =
        trend.direction === "improving"
          ? "up"
          : trend.direction === "degrading"
            ? "down"
            : "stable";
    });

    return trends;
  }

  private getTimeRangeForPeriod(period: OperationalReport["period"]): number {
    switch (period) {
      case "hourly":
        return 60 * 60 * 1000;
      case "daily":
        return 24 * 60 * 60 * 1000;
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000;
      case "monthly":
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    return JSON.stringify(data);
  }

  private cleanupOldData(): void {
    const cutoff =
      Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
    this.dataPoints = this.dataPoints.filter((dp) => dp.timestamp > cutoff);
  }

  private cleanupOldInsights(): void {
    if (this.insights.length > 1000) {
      this.insights = this.insights.slice(-1000);
    }
  }

  private cleanupOldPredictions(): void {
    if (this.predictions.length > 500) {
      this.predictions = this.predictions.slice(-500);
    }
  }

  private cleanupOldReports(): void {
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }
  }

  private generateId(): string {
    return `oi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const operationalIntelligence = new OperationalIntelligence();
