// @or Upgrade button with updated pricing
import React, { useState } from "react";
import { Check } from "lucide-react";

interface UpgradeButtonProps {
  className?: string;
  size?: "sm" | "lg";
}

export default function UpgradeButton({
  className = "",
  size = "sm",
}: UpgradeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
          size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3"
        } ${className}`}
      >
        ✨ Upgrade to Pro
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl border border-gray-200">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">✨</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Upgrade to Pro
                </h3>
                <p className="text-gray-600">
                  Unlock advanced AI models and unlimited conversations
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-1">
                      1.5M tokens/month
                    </div>
                    <div className="text-sm text-primary-700">
                      Claude Sonnet 4 • Gemini Pro • DeepSeek R1
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "GPT-4o (Latest)",
                    "Claude Sonnet 4",
                    "Grok 3 Beta",
                    "Gemini 2.5 Pro",
                    "🌐 Web Search on all models",
                    "1.5M tokens monthly",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-3 rounded-xl transition-all duration-300">
                  Coming Soon - $15/month
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
