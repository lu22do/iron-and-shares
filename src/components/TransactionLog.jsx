import { useEffect, useRef } from 'react';
import { Card } from './ui/Card';

export const TransactionLog = ({ logs }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (index) => {
    const now = new Date();
    // Approximate timestamp based on log order (newest = most recent)
    const secondsAgo = logs.length - index - 1;
    const logTime = new Date(now.getTime() - secondsAgo * 1000);
    return logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Card className="bg-slate-50 p-0 overflow-hidden">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 p-4 pb-2">Transaction Log</h4>
      <div ref={scrollRef} className="h-48 overflow-y-auto px-4 pb-4 font-mono text-sm text-slate-600">
        <div className="flex flex-col-reverse">
          {logs.slice().reverse().map((log, i) => (
            <div key={i} className="border-b border-slate-100 py-1">
              <span className="text-slate-400 mr-2">[{formatTimestamp(logs.length - 1 - i)}]</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
