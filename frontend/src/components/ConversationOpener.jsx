export default function ConversationOpener({ text }) {
  return (
    <div className="bg-gradient-to-br from-green-950/80 to-gray-900 rounded-xl p-5 border border-green-800/60">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-green-400">
          Suggested Conversation Opener
        </span>
      </div>
      <blockquote className="text-white text-sm leading-relaxed border-l-2 border-green-500 pl-4 italic">
        "{text}"
      </blockquote>
    </div>
  )
}
