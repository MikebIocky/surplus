"use client";

import React from "react";
import { CheckCircle, XCircle, Lock } from "lucide-react";

const features = [
  { label: "Unlimited messaging", monthly: true, annual: true },
  { label: "Priority support", monthly: true, annual: true },
  { label: "Access to exclusive features", monthly: true, annual: true },
  { label: "Cancel anytime", monthly: true, annual: true },
  { label: "Early access to new features", monthly: false, annual: true },
  { label: "VIP badge on your profile", monthly: false, annual: true },
  { label: "2 months free", monthly: false, annual: true },
  { label: "Advanced analytics", monthly: false, annual: true },
  { label: "Custom themes", monthly: false, annual: true },
];

export default function SubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold mb-2 text-center tracking-tight">Membership Plans</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">
        Unlock premium features and get the most out of your experience.
      </p>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
        {/* Monthly Plan */}
        <div className="flex-1 bg-white border rounded-2xl p-8 flex flex-col items-center shadow-sm relative">
          <h2 className="text-2xl font-bold mb-2">Monthly</h2>
          <div className="text-5xl font-extrabold text-green-600 mb-2">$9</div>
          <div className="text-gray-500 mb-6">per month</div>
          <ul className="w-full mb-8 space-y-3">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-base">
                {f.monthly ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-gray-300 w-5 h-5" />
                )}
                <span className={f.monthly ? "" : "text-gray-400 line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>
          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-semibold px-6 py-3 rounded-lg cursor-not-allowed opacity-70 mb-2"
            disabled
            title="Purchasing is not available yet"
          >
            <Lock className="w-5 h-5" /> Purchase Unavailable
          </button>
        </div>
        {/* Annual Plan */}
        <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-2xl p-8 flex flex-col items-center shadow-md scale-105 relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <span className="bg-green-600 text-white text-xs px-4 py-1 rounded-full font-bold shadow">Best Value</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Annual</h2>
          <div className="text-5xl font-extrabold text-green-700 mb-2">$90</div>
          <div className="text-gray-500 mb-6">per year <span className="text-xs">(Save 17%)</span></div>
          <ul className="w-full mb-8 space-y-3">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-base">
                {f.annual ? (
                  <CheckCircle className="text-green-600 w-5 h-5" />
                ) : (
                  <XCircle className="text-gray-300 w-5 h-5" />
                )}
                <span className={f.annual ? "" : "text-gray-400 line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>
          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-semibold px-6 py-3 rounded-lg cursor-not-allowed opacity-70 mb-2"
            disabled
            title="Purchasing is not available yet"
          >
            <Lock className="w-5 h-5" /> Purchase Unavailable
          </button>
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-8">
        <Lock className="inline w-4 h-4 mr-1 align-text-bottom" />
        Purchasing is not available yet. Please check back soon!
      </div>
    </div>
  );
}
