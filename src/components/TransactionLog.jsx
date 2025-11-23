import { Card } from './ui/Card';

export const TransactionLog = ({ logs }) => {
  return (
    <Card className="bg-slate-50 h-48 overflow-auto p-4 font-mono text-sm text-slate-600">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Transaction Log</h4>
      <div className="flex flex-col-reverse">
        {logs.slice().reverse().map((log, i) => (
          <div key={i} className="border-b border-slate-100 py-1">{log}</div>
        ))}
      </div>
    </Card>
  );
};
