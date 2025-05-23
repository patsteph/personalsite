/**
 * A/B Test Manager Component
 *
 * Admin interface for creating, managing, and analyzing A/B tests.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  type: "page" | "component" | "feature" | "content";
  trafficAllocation: number;
  variants: Variant[];
  startDate: string;
  endDate?: string;
  results?: ExperimentResults;
  createdAt: string;
}

interface Variant {
  id: string;
  name: string;
  description: string;
  trafficSplit: number;
  isControl: boolean;
}

interface ExperimentResults {
  status: string;
  confidence: number;
  winningVariant?: string;
  variantResults: Record<string, VariantResults>;
  sampleSize: number;
  conversionRates: Record<string, number>;
}

interface VariantResults {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  engagementMetrics: Record<string, number>;
}

export const ABTestManager: React.FC = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "active" | "draft" | "completed"
  >("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] =
    useState<Experiment | null>(null);

  useEffect(() => {
    if (user) {
      fetchExperiments();
    }
  }, [user, selectedTab]);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/experiments?status=${selectedTab}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments);
      }
    } catch (error) {
      console.error("Error fetching experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiments = experiments.filter((exp) => {
    switch (selectedTab) {
      case "active":
        return exp.status === "running" || exp.status === "paused";
      case "draft":
        return exp.status === "draft";
      case "completed":
        return exp.status === "completed";
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="ab-test-manager space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Test Manager</h1>
          <p className="mt-2 text-gray-600">
            Create and manage experiments to optimize user experience
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Create Experiment
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "active", label: "Active", icon: "🔄" },
            { id: "draft", label: "Draft", icon: "📝" },
            { id: "completed", label: "Completed", icon: "✅" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No {selectedTab} experiments found</p>
            {selectedTab === "draft" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Your First Experiment
              </button>
            )}
          </div>
        ) : (
          filteredExperiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onSelect={setSelectedExperiment}
              onUpdate={fetchExperiments}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateExperimentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchExperiments}
        />
      )}

      {selectedExperiment && (
        <ExperimentDetailsModal
          experiment={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
          onUpdate={fetchExperiments}
        />
      )}
    </div>
  );
};

// Experiment Card Component
const ExperimentCard: React.FC<{
  experiment: Experiment;
  onSelect: (experiment: Experiment) => void;
  onUpdate: () => void;
}> = ({ experiment, onSelect, onUpdate }) => {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(
        `/api/analytics/experiments/${experiment.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating experiment status:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {experiment.name}
            </h3>
            <span
              className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(experiment.status)}`}
            >
              {experiment.status}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{experiment.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 capitalize">{experiment.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Traffic:</span>
              <span className="ml-2">{experiment.trafficAllocation}%</span>
            </div>
            <div>
              <span className="text-gray-500">Variants:</span>
              <span className="ml-2">{experiment.variants.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Started:</span>
              <span className="ml-2">
                {new Date(experiment.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {experiment.results && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Sample Size:</span>
                  <span className="ml-2 font-medium">
                    {experiment.results.sampleSize}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {(experiment.results.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium capitalize">
                    {experiment.results.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-6 flex flex-col space-y-2">
          <button
            onClick={() => onSelect(experiment)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Details
          </button>

          {experiment.status === "draft" && (
            <button
              onClick={() => handleStatusChange("running")}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start Test
            </button>
          )}

          {experiment.status === "running" && (
            <button
              onClick={() => handleStatusChange("paused")}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Pause
            </button>
          )}

          {experiment.status === "paused" && (
            <button
              onClick={() => handleStatusChange("running")}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Resume
            </button>
          )}

          {(experiment.status === "running" ||
            experiment.status === "paused") && (
            <button
              onClick={() => handleStatusChange("completed")}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Experiment Modal Component
const CreateExperimentModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "page",
    trafficAllocation: 100,
    variants: [
      {
        name: "Control",
        description: "Original version",
        trafficSplit: 50,
        isControl: true,
      },
      {
        name: "Variant A",
        description: "Test version",
        trafficSplit: 50,
        isControl: false,
      },
    ],
    primaryGoal: {
      name: "Conversion Rate",
      type: "conversion",
      event: "form_submit",
    },
    startDate: new Date().toISOString().split("T")[0],
    duration: 14,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/analytics/experiments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error creating experiment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Create A/B Test Experiment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Homepage Hero Button Test"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe what you're testing and why"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="page">Page</option>
                <option value="component">Component</option>
                <option value="feature">Feature</option>
                <option value="content">Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Traffic Allocation (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.trafficAllocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trafficAllocation: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Experiment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Experiment Details Modal Component
const ExperimentDetailsModal: React.FC<{
  experiment: Experiment;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ experiment, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "settings"
  >("overview");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{experiment.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "results", label: "Results" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <ExperimentOverview experiment={experiment} />
          )}
          {activeTab === "results" && (
            <ExperimentResults experiment={experiment} />
          )}
          {activeTab === "settings" && (
            <ExperimentSettings experiment={experiment} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

// Experiment Overview Component
const ExperimentOverview: React.FC<{ experiment: Experiment }> = ({
  experiment,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Description
        </h3>
        <p className="text-gray-600">{experiment.description}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variants</h3>
        <div className="space-y-3">
          {experiment.variants.map((variant, index) => (
            <div key={variant.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {variant.name}
                    {variant.isControl && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Control
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">{variant.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {variant.trafficSplit}%
                  </div>
                  <div className="text-sm text-gray-500">Traffic Split</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Experiment Details
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>{" "}
              <span className="capitalize">{experiment.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>{" "}
              <span className="capitalize">{experiment.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Traffic Allocation:</span>{" "}
              {experiment.trafficAllocation}%
            </div>
            <div>
              <span className="text-gray-500">Start Date:</span>{" "}
              {new Date(experiment.startDate).toLocaleDateString()}
            </div>
            {experiment.endDate && (
              <div>
                <span className="text-gray-500">End Date:</span>{" "}
                {new Date(experiment.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress</h3>
          <div className="space-y-4">
            {experiment.results && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sample Size</span>
                    <span>{experiment.results.sampleSize}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((experiment.results.sampleSize / 1000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Statistical Confidence</span>
                    <span>
                      {(experiment.results.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${experiment.results.confidence * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Experiment Results Component
const ExperimentResults: React.FC<{ experiment: Experiment }> = ({
  experiment,
}) => {
  if (!experiment.results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results available yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Results will appear once the experiment starts collecting data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Results Summary
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {experiment.results.sampleSize}
            </div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(experiment.results.confidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Confidence Level</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                experiment.results.status === "significant_winner"
                  ? "text-green-600"
                  : experiment.results.status === "no_significant_difference"
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {experiment.results.status === "significant_winner"
                ? "🏆"
                : experiment.results.status === "no_significant_difference"
                  ? "⚖️"
                  : "📊"}
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {experiment.results.status.replace("_", " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Variant Results */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Variant Performance
        </h3>
        <div className="space-y-4">
          {Object.values(experiment.results.variantResults).map(
            (result, index) => {
              const variant = experiment.variants.find(
                (v) => v.id === result.variantId,
              );
              const isWinner =
                experiment.results?.winningVariant === result.variantId;

              return (
                <div
                  key={result.variantId}
                  className={`p-4 border rounded-lg ${isWinner ? "border-green-500 bg-green-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {variant?.name}
                      {variant?.isControl && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Control
                        </span>
                      )}
                      {isWinner && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Winner
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {result.participants}
                      </div>
                      <div className="text-gray-600">Participants</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {result.conversions}
                      </div>
                      <div className="text-gray-600">Conversions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {(result.conversionRate * 100).toFixed(2)}%
                      </div>
                      <div className="text-gray-600">Conversion Rate</div>
                    </div>
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${isWinner ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${result.conversionRate * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

// Experiment Settings Component
const ExperimentSettings: React.FC<{
  experiment: Experiment;
  onUpdate: () => void;
}> = ({ experiment, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Experiment Configuration
        </h3>
        <div className="text-sm text-gray-500">
          Settings management would be implemented here for updating experiment
          parameters.
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Danger Zone
        </h3>
        <div className="border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-3">
            Permanently delete this experiment. This action cannot be undone.
          </p>
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Delete Experiment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ABTestManager;
