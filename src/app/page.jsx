"use client";
import React from "react";
import {useState, useCallback} from "react";
import * as Recharts from "recharts";
import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [form, setForm] = useState({
    topic: "",
    brandGuidelines: "",
    urls: "",
  });
  const [investment, setInvestment] = useState(50000);
  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("triggers");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [scrapedData, setScrapedData] = useState(null);
  const [expectedRoi, setExpectedRoi] = useState(32.5);
  const [results, setResults] = useState({
    triggers: [],
    competitors: [],
    insights: [],
    demographics: [],
    trends: [],
    targeting: [],
    marketSize: [],
    userBehavior: [],
    adIdeas: [],
    campaignStrategy: [],
    budgetPlanning: [],
    creativeDirection: [],
  });
  const [visualData, setVisualData] = useState({
    wordCloud: {},
    sentiments: {},
    trends: [],
  });
  const [error, setError] = useState("");
  const [showProTip, setShowProTip] = useState(true);
  const [videos, setVideos] = useState([
    {
      title: "Loading...",
      description: "Please search to see relevant videos",
      url: "#",
    },
    {
      title: "Loading...",
      description: "Please search to see relevant videos",
      url: "#",
    },
    {
      title: "Loading...",
      description: "Please search to see relevant videos",
      url: "#",
    },
  ]);
  const calculateRoi = useCallback(async (amount) => {
    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Given an investment amount of ${amount} in digital marketing, what would be a realistic expected ROI percentage based on current market trends? Return only a number without any symbols.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const roiValue = parseFloat(data.result);
      if (!isNaN(roiValue)) {
        setExpectedRoi(roiValue);
      }
    } catch (err) {
      console.error("Failed to calculate ROI:", err);
    }
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInvestmentChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const newValue = Number(value);
    setInvestment(newValue);
    calculateRoi(newValue);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const searchResponse = await fetch("/integrations/google-search/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `${form.topic} market analysis ROI trends`,
          num: 5,
        }),
      });

      const searchData = await searchResponse.json();

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a market analysis expert. Provide detailed responses with at least 100 words for each category. Include specific examples, data points, and actionable recommendations.",
            },
            {
              role: "user",
              content: `Analyze this topic: ${form.topic}. Brand guidelines: ${
                form.brandGuidelines
              }. URLs: ${
                form.urls
              }. Additional context from web search: ${JSON.stringify(
                searchData.items
              )}. Provide comprehensive analysis with at least 100 words per category.`,
            },
          ],
          json_schema: {
            name: "market_analysis",
            schema: {
              type: "object",
              properties: {
                triggers: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                competitors: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                insights: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                demographics: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                trends: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                targeting: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                marketSize: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                userBehavior: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                adIdeas: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                campaignStrategy: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                budgetPlanning: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
                creativeDirection: {
                  type: "array",
                  items: { type: "string", minLength: 100 },
                },
              },
              required: [
                "triggers",
                "competitors",
                "insights",
                "demographics",
                "trends",
                "targeting",
                "marketSize",
                "userBehavior",
                "adIdeas",
                "campaignStrategy",
                "budgetPlanning",
                "creativeDirection",
              ],
              additionalProperties: false,
            },
          },
          stream: true,
        }),
      });

      handleStreamResponse(response);
    } catch (err) {
      setError("Failed to analyze. Please try again.");
      setLoading(false);
    }
  };
  const handleFinish = useCallback(
    (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (!parsedMessage || typeof parsedMessage !== "object") {
          throw new Error("Invalid response format");
        }

        setResults(parsedMessage);
        setShowProTip(false);

        const wordCloudData = {};
        const sentimentData = {};
        const trendData = [];

        Object.entries(parsedMessage).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            items.forEach((item) => {
              if (typeof item === "string") {
                item.split(" ").forEach((word) => {
                  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
                  if (cleanWord.length > 3) {
                    wordCloudData[cleanWord] =
                      (wordCloudData[cleanWord] || 0) + 1;
                  }
                });
              }
            });

            const positiveWords = [
              "increase",
              "growth",
              "opportunity",
              "positive",
              "success",
            ];
            const negativeWords = [
              "decrease",
              "challenge",
              "risk",
              "negative",
              "threat",
            ];

            let positive = 0;
            let negative = 0;
            items.forEach((item) => {
              if (typeof item === "string") {
                positiveWords.forEach((word) => {
                  if (item.toLowerCase().includes(word)) positive++;
                });
                negativeWords.forEach((word) => {
                  if (item.toLowerCase().includes(word)) negative++;
                });
              }
            });

            const total = positive + negative;
            sentimentData[category] = {
              positive: total > 0 ? (positive / total) * 100 : 0,
              negative: total > 0 ? (negative / total) * 100 : 0,
            };

            if (category === "trends" && Array.isArray(items)) {
              items.forEach((item, index) => {
                if (typeof item === "string") {
                  trendData.push({
                    label: `Trend ${index + 1}`,
                    value: Math.floor(Math.random() * 100),
                  });
                }
              });
            }
          }
        });

        setVisualData({
          wordCloud: wordCloudData,
          sentiments: sentimentData,
          trends: trendData,
        });

        if (form.topic) {
          const searchQuery = `marketing tips for ${form.topic}`;
          setVideos([
            {
              title: `${form.topic} Marketing Strategy`,
              description: "Expert marketing insights",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                searchQuery + " marketing strategy"
              )}`,
            },
            {
              title: `${form.topic} Growth Tips`,
              description: "Growth hacking techniques",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                searchQuery + " growth tips"
              )}`,
            },
            {
              title: `${form.topic} Analytics`,
              description: "Data-driven insights",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                searchQuery + " analytics"
              )}`,
            },
          ]);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: message },
        ]);
        setStreamingMessage("");
        setLoading(false);
      } catch (error) {
        console.error("Error parsing results:", error);
        setError("Unable to parse the results. Please try again.");
        setStreamingMessage("");
        setLoading(false);
      }
    },
    [form.topic]
  );
  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <div className="w-64 bg-white h-screen fixed shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold font-roboto text-[#1e293b] mb-8">
              ART Finder Pro
            </h1>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeSection === "dashboard"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#64748b] hover:bg-gray-100"
                }`}
              >
                <i className="fas fa-chart-pie mr-3"></i>
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection("analysis")}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeSection === "analysis"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#64748b] hover:bg-gray-100"
                }`}
              >
                <i className="fas fa-magnifying-glass-chart mr-3"></i>
                Analysis
              </button>
              <button
                onClick={() => setActiveSection("automation")}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeSection === "automation"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#64748b] hover:bg-gray-100"
                }`}
              >
                <i className="fas fa-comments mr-3"></i>
                Chat Assistant
              </button>
            </nav>
          </div>
        </div>

        <div className="ml-64 flex-1 p-6">
          {activeSection === "dashboard" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold font-roboto text-[#1e293b] mb-6">
                Campaign ROI Dashboard
              </h2>
              {results[activeTab]?.length > 0 ? (
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-xl font-bold font-roboto text-[#1e293b] mb-2">
                        Money Invested
                      </h3>
                      {isEditingInvestment ? (
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-[#3b82f6] mr-2">
                            $
                          </span>
                          <input
                            type="text"
                            value={investment}
                            onChange={handleInvestmentChange}
                            onBlur={() => setIsEditingInvestment(false)}
                            className="text-3xl font-bold text-[#3b82f6] bg-transparent border-b-2 border-[#3b82f6] focus:outline-none w-40"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <p
                          className="text-3xl font-bold text-[#3b82f6] cursor-pointer hover:opacity-80"
                          onClick={() => setIsEditingInvestment(true)}
                        >
                          ${investment.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-xl font-bold font-roboto text-[#1e293b] mb-2">
                        Expected ROI
                      </h3>
                      <p className="text-3xl font-bold text-[#10b981]">
                        {expectedRoi}%
                      </p>
                      <p className="text-sm text-[#64748b] mt-2">
                        Projected return based on market analysis
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-xl font-bold font-roboto text-[#1e293b] mb-2">
                        Potential Return
                      </h3>
                      <p className="text-3xl font-bold text-[#f59e0b]">
                        ${((investment * expectedRoi) / 100).toLocaleString()}
                      </p>
                      <p className="text-sm text-[#64748b] mt-2">
                        Estimated total return on investment
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-xl font-bold font-roboto text-[#1e293b] mb-4">
                        ROI Projection
                      </h3>
                      <div className="h-[400px]">
                        <Recharts.ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <Recharts.LineChart
                            data={[
                              {
                                month: "January",
                                investment,
                                expectedRoi: expectedRoi * 0.5,
                              },
                              {
                                month: "February",
                                investment,
                                expectedRoi: expectedRoi * 0.6,
                              },
                              {
                                month: "March",
                                investment,
                                expectedRoi: expectedRoi * 0.8,
                              },
                              {
                                month: "April",
                                investment,
                                expectedRoi: expectedRoi * 0.7,
                              },
                              {
                                month: "May",
                                investment,
                                expectedRoi: expectedRoi * 0.9,
                              },
                              {
                                month: "June",
                                investment,
                                expectedRoi: expectedRoi,
                              },
                            ]}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 10,
                            }}
                          >
                            <Recharts.CartesianGrid strokeDasharray="3 3" />
                            <Recharts.XAxis
                              dataKey="month"
                              tick={{ fill: "#64748b" }}
                            />
                            <Recharts.YAxis
                              yAxisId="left"
                              label={{
                                value: "Investment ($)",
                                angle: -90,
                                position: "insideLeft",
                                style: { fill: "#64748b" },
                              }}
                              tick={{ fill: "#64748b" }}
                            />
                            <Recharts.YAxis
                              yAxisId="right"
                              orientation="right"
                              label={{
                                value: "ROI (%)",
                                angle: 90,
                                position: "insideRight",
                                style: { fill: "#64748b" },
                              }}
                              tick={{ fill: "#64748b" }}
                            />
                            <Recharts.Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-4 rounded shadow-lg border">
                                      <p className="font-bold text-[#1e293b]">
                                        {label}
                                      </p>
                                      <p className="text-[#3b82f6]">
                                        Investment: $
                                        {payload[0].value.toLocaleString()}
                                      </p>
                                      <p className="text-[#10b981]">
                                        Expected ROI:{" "}
                                        {payload[1].value.toFixed(1)}%
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Recharts.Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="investment"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                            />
                            <Recharts.Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="expectedRoi"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ fill: "#10b981", strokeWidth: 2 }}
                            />
                          </Recharts.LineChart>
                        </Recharts.ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <h3 className="text-xl font-bold font-roboto text-[#1e293b] mb-4">
                        ROI Distribution
                      </h3>
                      <div className="h-[400px]">
                        <Recharts.ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <Recharts.PieChart>
                            <Recharts.Pie
                              data={[
                                {
                                  name: "Direct Revenue",
                                  value: investment * 0.4,
                                  fill: "#3b82f6",
                                },
                                {
                                  name: "Organic Growth",
                                  value: investment * 0.3,
                                  fill: "#10b981",
                                },
                                {
                                  name: "Brand Value",
                                  value: investment * 0.2,
                                  fill: "#f59e0b",
                                },
                                {
                                  name: "Market Share",
                                  value: investment * 0.1,
                                  fill: "#6366f1",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={150}
                              dataKey="value"
                            ></Recharts.Pie>
                            <Recharts.Tooltip />
                          </Recharts.PieChart>
                        </Recharts.ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[#64748b] mb-4">
                  Start by navigating to the Analysis section to generate
                  insights for your campaign.
                </p>
              )}
            </div>
          )}

          {activeSection === "analysis" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-[#334155] font-roboto mb-2"
                      htmlFor="topic"
                    >
                      Research Topic
                    </label>
                    <input
                      id="topic"
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter your product or topic (e.g., 'fitness app', 'meal planning service')"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[#334155] font-roboto mb-2"
                      htmlFor="urls"
                    >
                      URLs to Analyze (Optional)
                    </label>
                    <textarea
                      id="urls"
                      name="urls"
                      value={form.urls}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter URLs to analyze (one per line) - e.g., blog posts, competitor websites, review pages"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[#334155] font-roboto mb-2"
                      htmlFor="brandGuidelines"
                    >
                      Brand Guidelines
                    </label>
                    <textarea
                      id="brandGuidelines"
                      name="brandGuidelines"
                      value={form.brandGuidelines}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter any specific brand guidelines or preferences"
                    />
                  </div>
                  {error && <p className="text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-roboto py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>{" "}
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <i className="fas fa-rocket mr-2"></i> Generate Analysis
                      </span>
                    )}
                  </button>
                </form>
              </div>
              <div className="flex border-b mb-6 flex-wrap">
                {[
                  "triggers",
                  "competitors",
                  "insights",
                  "demographics",
                  "trends",
                  "targeting",
                  "marketSize",
                  "userBehavior",
                  "adIdeas",
                  "campaignStrategy",
                  "budgetPlanning",
                  "creativeDirection",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-roboto ${
                      activeTab === tab
                        ? "text-[#3b82f6] border-b-2 border-[#3b82f6]"
                        : "text-[#64748b]"
                    }`}
                  >
                    <i
                      className={`fas ${
                        tab === "triggers"
                          ? "fa-bullseye"
                          : tab === "competitors"
                          ? "fa-chart-line"
                          : tab === "insights"
                          ? "fa-lightbulb"
                          : tab === "demographics"
                          ? "fa-users"
                          : tab === "trends"
                          ? "fa-chart-bar"
                          : tab === "targeting"
                          ? "fa-crosshairs"
                          : tab === "marketSize"
                          ? "fa-chart-pie"
                          : tab === "userBehavior"
                          ? "fa-user-check"
                          : tab === "adIdeas"
                          ? "fa-ad"
                          : tab === "campaignStrategy"
                          ? "fa-chess"
                          : tab === "budgetPlanning"
                          ? "fa-wallet"
                          : "fa-paint-brush"
                      } mr-2`}
                    ></i>
                    {tab
                      .replace(/([A-Z])/g, " $1")
                      .charAt(0)
                      .toUpperCase() + tab.replace(/([A-Z])/g, " $1").slice(1)}
                  </button>
                ))}
              </div>
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="text-center">
                    {streamingMessage ? (
                      <div className="text-left w-full max-w-2xl">
                        <p className="text-[#334155] font-roboto whitespace-pre-wrap">
                          {streamingMessage}
                        </p>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
                        <p>Gathering insights...</p>
                      </>
                    )}
                  </div>
                ) : results[activeTab]?.length === 0 ? (
                  <div className="text-center">
                    <i className="fas fa-search text-4xl mb-4"></i>
                    <p>Enter a topic and start research to see results</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results[activeTab].map((item, index) => (
                      <div key={index} className="bg-[#f8fafc] p-4 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#3b82f6] text-white rounded-full mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-[#334155] font-roboto">{item}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "automation" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold font-roboto text-[#1e293b] mb-6">
                Analysis Chat Assistant
              </h2>
              <div className="flex flex-col h-[600px]">
                <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-lg">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        msg.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-lg ${
                          msg.role === "user"
                            ? "bg-[#3b82f6] text-white"
                            : "bg-[#f1f5f9] text-[#334155]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {streamingMessage && (
                    <div className="text-left">
                      <div className="inline-block p-4 rounded-lg bg-[#f1f5f9] text-[#334155]">
                        {streamingMessage}
                      </div>
                    </div>
                  )}
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.target.elements.message;
                    const message = input.value.trim();
                    if (!message) return;

                    const userMessage = { role: "user", content: message };
                    setMessages((prev) => [...prev, userMessage]);
                    input.value = "";

                    try {
                      const response = await fetch(
                        "/integrations/chat-gpt/conversationgpt4",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            messages: [...messages, userMessage],
                            stream: true,
                          }),
                        }
                      );
                      handleStreamResponse(response);
                    } catch (err) {
                      setError("Failed to send message. Please try again.");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Ask me anything about your analysis..."
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#3b82f6] text-white px-6 py-3 rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;