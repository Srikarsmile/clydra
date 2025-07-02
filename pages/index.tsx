import Link from "next/link";
import { useState, useEffect } from "react";
import PageTransition from "../components/PageTransition";

export default function Home() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const demoMessages = [
    { type: "user", text: "help me write a fire Instagram caption 🔥" },
    { type: "ai", text: "Say less! ✨ How about: 'Living my best life, no cap 💯 Main character energy activated 🌟'" },
    { type: "user", text: "that's actually lowkey perfect ngl" },
    { type: "ai", text: "I got you! That's what I'm here for 😎" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentMessage < demoMessages.length - 1) {
        setIsTyping(true);
        setTimeout(() => {
          setCurrentMessage(prev => prev + 1);
          setIsTyping(false);
        }, 1000);
      } else {
        // Reset after showing all messages
        setTimeout(() => {
          setCurrentMessage(0);
        }, 3000);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentMessage]);

  const features = [
    {
      title: "Multiple AI Models",
      description: "Access GPT-4o, Claude Sonnet, and Gemini all in one place",
      icon: "🧠",
      gradient: "from-purple-500/20 to-blue-500/20"
    },
    {
      title: "Real-time Streaming",
      description: "Get instant responses with our optimized streaming technology",
      icon: "⚡",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      title: "Smart Usage Tracking",
      description: "Built-in token monitoring with transparent pricing",
      icon: "📊",
      gradient: "from-cyan-500/20 to-purple-500/20"
    },
  ];

  const models = [
    {
      name: "GPT-3.5 Turbo",
      status: "Free",
      description: "Perfect for everyday conversations and quick tasks",
      color: "from-green-400 to-emerald-500"
    },
    {
      name: "GPT-4o",
      status: "Pro",
      description: "Advanced reasoning for complex problem solving",
      color: "from-purple-400 to-purple-600"
    },
    {
      name: "Claude Sonnet",
      status: "Pro", 
      description: "Superior writing and creative capabilities",
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Gemini Pro",
      status: "Pro",
      description: "Multimodal AI with vision understanding",
      color: "from-cyan-400 to-cyan-600"
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-2xl animate-float animation-delay-200"></div>
          <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-400/25 to-purple-400/25 rounded-full blur-xl animate-float animation-delay-400"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 glass border-b border-white/20 backdrop-blur-xl sticky top-0">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Clydra
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-slate-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Features
                </Link>
                <Link href="#models" className="text-slate-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Models
                </Link>
                <Link href="#pricing" className="text-slate-600 hover:text-purple-600 transition-colors duration-300 font-medium">
                  Pricing
                </Link>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-4">
                <Link href="/sign-in" className="text-slate-600 hover:text-slate-900 font-medium transition-colors duration-300">
                  Sign In
                </Link>
                <Link href="/sign-up" className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-12 pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Content */}
              <div className="text-left">
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full text-purple-700 font-medium text-sm border border-purple-200/50 backdrop-blur-sm mb-6">
                    ✨ AI that actually gets you
                  </span>
                  <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
                    Chat with AI
                    <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      that speaks
                    </span>
                    <span className="block text-slate-900">your vibe</span>
                  </h1>
                </div>

                <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                  No cap, this is the AI platform you've been waiting for. GPT-4o, Claude, and Gemini all in one place. Free to start, premium when you need it. 
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/sign-up" className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-lg overflow-hidden hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-500">
                    <span className="relative z-10 flex items-center">
                      Start chatting free
                      <span className="ml-2 text-xl">🚀</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Link>
                  
                  <Link href="#models" className="px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl font-bold text-lg border border-slate-200/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transform hover:scale-105 transition-all duration-300">
                    See what's possible
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full border-2 border-white"></div>
                  </div>
                  <span>1000+ students already vibing with AI</span>
                </div>
              </div>

              {/* Right Side - Interactive Chat Demo */}
              <div className="relative">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 max-w-md mx-auto lg:mx-0">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">Clydra AI</div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-slate-500">Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl">💫</div>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-4 h-64 overflow-hidden">
                    {demoMessages.slice(0, currentMessage + 1).map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start animate-fade-in-up">
                        <div className="bg-slate-100 px-4 py-3 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-100"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="mt-6 pt-4 border-t border-slate-200/50">
                    <div className="flex items-center space-x-3 bg-slate-50 rounded-2xl px-4 py-3">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent text-slate-600 placeholder-slate-400 text-sm outline-none"
                        disabled
                      />
                      <button className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white hover:shadow-lg transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements around chat */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-float">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg animate-float animation-delay-300">
                  <span className="text-lg">🔥</span>
                </div>
                <div className="absolute top-1/2 -right-8 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center shadow-lg animate-float animation-delay-500">
                  <span className="text-sm">✨</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
                Why Choose 
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Clydra</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
                Experience the perfect blend of power, simplicity, and innovation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group relative p-8 rounded-3xl bg-gradient-to-br ${feature.gradient} backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl animate-fade-in-up animation-delay-${(index + 2) * 100}`}
                >
                  <div className="absolute inset-0 bg-white/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Models Section */}
        <section id="models" className="py-24 bg-gradient-to-br from-slate-50/50 to-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
                Powerful 
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> AI Models</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
                Access the world's most advanced AI models through one unified interface
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {models.map((model, index) => (
                <div
                  key={index}
                  className={`group relative p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 hover:border-white/60 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-xl animate-fade-in-up animation-delay-${(index + 2) * 100}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      {model.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${model.color}`}>
                      {model.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {model.description}
                  </p>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${model.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
                Simple 
                <span className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent"> Pricing</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
                Start free, upgrade when you need more power
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 hover:border-white/60 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-xl">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-slate-800 mb-6">
                    ₹0
                    <span className="text-lg text-slate-500 font-normal">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">40 messages daily</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">GPT-3.5 Turbo access</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">Chat history</span>
                    </li>
                  </ul>
                  <Link href="/sign-up" className="w-full inline-block text-center px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-300">
                    Get Started Free
                  </Link>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border-2 border-purple-300/50 hover:border-purple-400/60 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-slate-800 mb-6">
                    ₹799
                    <span className="text-lg text-slate-500 font-normal">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">Unlimited messages</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">All premium AI models</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">Priority support</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-slate-700">Advanced features</span>
                    </li>
                  </ul>
                  <Link href="/sign-up" className="w-full inline-block text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
              Ready to Experience
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent"> Clydra</span>?
            </h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Join thousands of users already having amazing conversations with AI
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/sign-up" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-500">
                Start Free Today
              </Link>
              <Link href="#features" className="px-10 py-4 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl font-semibold text-lg border border-slate-200/50 hover:bg-white hover:shadow-lg transition-all duration-300">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  Clydra
                </div>
                <p className="text-slate-300 max-w-md leading-relaxed">
                  The next-generation AI chat platform that brings together the world's most powerful AI models in one beautiful interface.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="#features" className="text-slate-300 hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#models" className="text-slate-300 hover:text-white transition-colors">AI Models</Link></li>
                  <li><Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="text-slate-300 hover:text-white transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-400">© 2024 Clydra. All rights reserved.</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <span className="text-slate-400">Made with ❤️ for AI enthusiasts</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
