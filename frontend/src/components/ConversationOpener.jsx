export default function ConversationOpener({ text }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-100 p-5 shadow-sm
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-green-700">
          Suggested Conversation Opener
        </span>
      </div>
      <blockquote className="text-gray-800 text-sm leading-relaxed border-l-2 border-green-400 pl-4 italic">
        "{text}"
      </blockquote>
    </div>
  )
}
