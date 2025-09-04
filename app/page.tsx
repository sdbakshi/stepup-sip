"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileDown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSXNS from "xlsx";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const [params, setParams] = useState({
    startSIP: 3000,
    stepType: "percent" as "percent" | "fixed",
    stepValue: 10,
    stepInterval: 6,
    annualReturn: 12,
    annualInflation: 6,
    years: 20,
    timing: "end" as "end" | "start",
  });
  const [showMonthly, setShowMonthly] = useState(false);

  const monthlyRate = useMemo(() => params.annualReturn / 100 / 12, [params.annualReturn]);
  const monthlyInfl = useMemo(() => params.annualInflation / 100 / 12, [params.annualInflation]);
  const totalMonths = useMemo(() => params.years * 12, [params.years]);

  type MonthRow = { month: number; year: number; monthName: string; sip: number; startBal: number; interest: number; endBal: number; inflIndex: number; endBalReal: number; };

  const schedule: MonthRow[] = useMemo(() => {
    const rows: MonthRow[] = [];
    let prevEnd = 0;
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let m = 1; m <= totalMonths; m++) {
      const year = Math.floor((m - 1) / 12) + 1;
      const monthName = monthNames[(m - 1) % 12];
      const steps = Math.floor((m - 1) / params.stepInterval);
      const sip = params.stepType === "percent" ? params.startSIP * Math.pow(1 + params.stepValue / 100, steps) : params.startSIP + params.stepValue * steps;

      let startBal, interest, endBal;
      if (params.timing === "end") { startBal = prevEnd; interest = startBal * monthlyRate; endBal = startBal + interest + sip; }
      else { startBal = prevEnd + sip; interest = startBal * monthlyRate; endBal = startBal + interest; }

      const inflIndex = Math.pow(1 + monthlyInfl, m);
      const endBalReal = endBal / inflIndex;

      rows.push({ month: m, year, monthName, sip, startBal, interest, endBal, inflIndex, endBalReal });
      prevEnd = endBal;
    }
    return rows;
  }, [params, monthlyRate, monthlyInfl, totalMonths]);

  type YearRow = { year: number; startBal: number; contrib: number; endBal: number; returnEarned: number; startSIP: number; endSIP: number; endBalReal: number; };

  const yearly: YearRow[] = useMemo(() => {
    const out: YearRow[] = [];
    for (let y = 1; y <= params.years; y++) {
      const firstIdx = (y - 1) * 12;
      const lastIdx = y * 12 - 1;
      const startBal = firstIdx === 0 ? 0 : schedule[firstIdx - 1].endBal;
      const contrib = schedule.slice(firstIdx, lastIdx + 1).reduce((a, r) => a + r.sip, 0);
      const endBal = schedule[lastIdx]?.endBal ?? 0;
      const returnEarned = endBal - startBal - contrib;
      const startSIP = schedule[firstIdx]?.sip ?? 0;
      const endSIP = schedule[lastIdx]?.sip ?? 0;
      const endBalReal = schedule[lastIdx]?.endBalReal ?? 0;
      out.push({ year: y, startBal, contrib, endBal, returnEarned, startSIP, endSIP, endBalReal });
    }
    return out;
  }, [schedule, params.years]);

  const totals = useMemo(() => {
    const totalContrib = schedule.reduce((a, r) => a + r.sip, 0);
    const finalNominal = schedule.at(-1)?.endBal ?? 0;
    const finalReal = schedule.at(-1)?.endBalReal ?? 0;
    const gain = finalNominal - totalContrib;
    return { totalContrib, finalNominal, finalReal, gain };
  }, [schedule]);

  const fmtINR = (n: number, fractionDigits: number = 0) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(n || 0);

  const resetDefaults = () => setParams({ startSIP: 3000, stepType: "percent", stepValue: 10, stepInterval: 6, annualReturn: 12, annualInflation: 6, years: 20, timing: "end" });

  const downloadCSV = () => {
    const headers = ["Year","Start Balance (₹)","Contribution (₹)","End Balance – Nominal (₹)","Return Earned (₹)","Start SIP (₹)","End SIP (₹)","End Balance – Real (₹, today)"];
    const rows = yearly.map((y) => [y.year, y.startBal, y.contrib, y.endBal, y.returnEarned, y.startSIP, y.endSIP, y.endBalReal]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "stepup_sip_yearly.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const downloadXLSX = async () => {
    const XLSX = XLSXNS;
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ["Parameter","Value"],
      ["Start Monthly SIP", params.startSIP],
      [params.stepType === "percent" ? "Step-up %" : "Fixed Step-up Amount (₹)", params.stepValue],
      ["Step-up Interval (months)", params.stepInterval],
      ["Annual Return %", params.annualReturn],
      ["Annual Inflation %", params.annualInflation],
      ["Contribution Timing", params.timing === "end" ? "End of Month" : "Start of Month"],
      ["Years", params.years],
      [],
      ["Year","Start Balance","Contribution","End Balance (Nominal)","Return Earned","Start SIP","End SIP","End Balance (Real)"],
      ...yearly.map((y) => [y.year, y.startBal, y.contrib, y.endBal, y.returnEarned, y.startSIP, y.endSIP, y.endBalReal]),
    ];
    const monthlyData = [
      ["Month #","Year","Month","SIP (₹)","Start Bal (₹)","Interest (₹)","End Bal – Nominal (₹)","Inflation Index","End Bal – Real (₹)"],
      ...schedule.map((r) => [r.month, r.year, r.monthName, r.sip, r.startBal, r.interest, r.endBal, r.inflIndex, r.endBalReal]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly");
    XLSX.writeFile(wb, "stepup_sip_calculator.xlsx");
  };

  const chartData = useMemo(() => schedule.map((r) => ({ name: `Y${r.year}-${r.monthName}`, Nominal: Math.round(r.endBal), Real: Math.round(r.endBalReal) })), [schedule]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
          Step-Up SIP & Inflation Calculator
        </motion.h1>
        <p className="text-slate-600 mt-1 mb-6">Steady, traditional SIP discipline—enhanced with modern compounding and clear, real-value metrics.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-1">
            <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Monthly SIP (₹)</Label>
                  <Input type="number" min={0} step={100} value={params.startSIP} onChange={(e) => setParams({ ...params, startSIP: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Years</Label>
                  <Input type="number" min={1} max={60} step={1} value={params.years} onChange={(e) => setParams({ ...params, years: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
                <div>
                  <Label>Annual Return %</Label>
                  <Input type="number" min={0} step={0.1} value={params.annualReturn} onChange={(e) => setParams({ ...params, annualReturn: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Annual Inflation %</Label>
                  <Input type="number" min={0} step={0.1} value={params.annualInflation} onChange={(e) => setParams({ ...params, annualInflation: Number(e.target.value) || 0 })} />
                </div>

                <div className="col-span-2">
                  <Label>Step-Up Type</Label>
                  <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={params.stepType} onChange={(e) => setParams({ ...params, stepType: e.target.value as any })}>
                    <option value="percent">Percentage step-up</option>
                    <option value="fixed">Fixed ₹ step-up</option>
                  </select>
                </div>

                <div>
                  <Label>{params.stepType === "percent" ? "Step-Up % " : "Step-Up Amount (₹)"}</Label>
                  <Input type="number" min={0} step={params.stepType === "percent" ? 0.1 : 100} value={params.stepValue} onChange={(e) => setParams({ ...params, stepValue: Number(e.target.value) || 0 })} />
                </div>

                <div>
                  <Label>Step-Up Interval (months)</Label>
                  <Input type="number" min={1} step={1} value={params.stepInterval} onChange={(e) => setParams({ ...params, stepInterval: Math.max(1, Number(e.target.value) || 1) })} />
                </div>

                <div className="col-span-2 flex items-center justify-between rounded-2xl border p-3">
                  <div>
                    <Label>Contribution Timing</Label>
                    <div className="text-xs text-slate-500">Start-of-month typically yields a slightly higher corpus.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${params.timing === "end" ? "font-semibold" : "text-slate-500"}`}>End</span>
                    <Switch checked={params.timing === "start"} onCheckedChange={(val) => setParams({ ...params, timing: val ? "start" : "end" })} />
                    <span className={`text-xs ${params.timing === "start" ? "font-semibold" : "text-slate-500"}`}>Start</span>
                  </div>
                </div>

                <div className="col-span-2 flex gap-2">
                  <Button onClick={resetDefaults}><RefreshCw className="mr-2 h-4 w-4" /> Reset</Button>
                  <Button onClick={downloadCSV} variant="outline"><Download className="mr-2 h-4 w-4" /> CSV (Yearly)</Button>
                  <Button onClick={downloadXLSX}><FileDown className="mr-2 h-4 w-4" /> Excel (All)</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Key Results</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Stat label="Final Corpus (Nominal)" value={fmtINR(totals.finalNominal)} />
                  <Stat label="Final Corpus (Real, today)" value={fmtINR(totals.finalReal)} />
                  <Stat label="Total Invested" value={fmtINR(totals.totalContrib)} />
                  <Stat label="Wealth Gain (Nominal)" value={fmtINR(totals.gain)} />
                </div>
                <Separator className="my-4" />
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 6, right: 12, top: 10, bottom: 0 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis tickFormatter={(v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v as number)} />
                      <ReTooltip formatter={(val: any) => fmtINR(Number(val))} />
                      <Legend />
                      <Line type="monotone" dataKey="Nominal" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Real" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Year-by-Year Summary</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Start Balance</TableHead>
                      <TableHead className="text-right">Contribution</TableHead>
                      <TableHead className="text-right">End Balance (Nominal)</TableHead>
                      <TableHead className="text-right">Return Earned</TableHead>
                      <TableHead className="text-right">Start SIP</TableHead>
                      <TableHead className="text-right">End SIP</TableHead>
                      <TableHead className="text-right">End Balance (Real)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearly.map((y) => (
                      <TableRow key={y.year}>
                        <TableCell>{y.year}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.startBal)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.contrib)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.endBal)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.returnEarned)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.startSIP)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.endSIP)}</TableCell>
                        <TableCell className="text-right">{fmtINR(y.endBalReal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Month-by-Month Details</CardTitle></CardHeader>
              <CardContent className="overflow-auto">
                <div className="flex items-center justify-end pb-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Show table</span>
                    <Switch checked={showMonthly} onCheckedChange={setShowMonthly} />
                  </div>
                </div>
                {showMonthly ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Mon</TableHead>
                        <TableHead className="text-right">SIP</TableHead>
                        <TableHead className="text-right">Start</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">End (Nominal)</TableHead>
                        <TableHead className="text-right">Inflation Index</TableHead>
                        <TableHead className="text-right">End (Real)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((r) => (
                        <TableRow key={r.month}>
                          <TableCell>{r.month}</TableCell>
                          <TableCell>{r.year}</TableCell>
                          <TableCell>{r.monthName}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.sip)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.startBal)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.interest)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.endBal)}</TableCell>
                          <TableCell className="text-right">{r.inflIndex.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.endBalReal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-slate-600">Toggle to render the full monthly schedule.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-6">
          Notes: Returns compound monthly from the annual rate; inflation adjusts balances to today’s rupees.
          Step-up applies every N months using either percentage compounding or fixed ₹ increments.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg md:text-xl font-semibold text-slate-800">{value}</div>
    </motion.div>
  );
}
