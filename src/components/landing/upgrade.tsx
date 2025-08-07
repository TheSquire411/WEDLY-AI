
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const upgradeData = [
  {
    title: "BUDGETING",
    old: {
      header: "Out with the Old",
      text: "Spreadsheet Headaches",
      description: "Manually updating cells, formulas breaking, and having no real-time insight into your spending.",
    },
    new: {
      header: "In with the New & Improved",
      text: "Your AI Budget Guardian",
      description: "Connect your accounts for automated expense tracking and get intelligent alerts before you overspend.",
    },
  },
  {
    title: "YOUR VOWS",
    old: {
      header: "Out with the Old",
      text: "Painful Writer's Block",
      description: "The pressure to be perfect, leading to generic phrases and last-minute panic writing.",
    },
    new: {
      header: "In with the New & Improved",
      text: "Your Personal Vow Co-Pilot",
      description: "Answer a few simple questions about your relationship and let our AI craft a heartfelt, unique starting point in seconds.",
    },
  },
    {
    title: "GUEST LIST",
    old: {
      header: "Out with the Old",
      text: "Guest List Chaos",
      description: "Chasing down RSVPs across multiple platforms and trying to remember who has a nut allergy.",
    },
    new: {
      header: "In with the New & Improved",
      text: "Smart Seating & Management",
      description: "Manage your entire guest list in one place, and let our AI suggest optimal seating arrangements.",
    },
  },
];

export function Upgrade() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-headline font-bold text-gray-900 sm:text-4xl">
            It's Time for a Wedding Planning Upgrade
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Forget the binders and spreadsheets. See how Wedly's AI-powered approach transforms the most stressful parts of wedding planning into an effortless experience.
          </p>
        </div>

        <div className="space-y-8">
            {upgradeData.map((item) => (
                <Card key={item.title} className="shadow-lg overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold tracking-widest text-primary text-center">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">
                        <div className="bg-white p-6">
                            <h3 className="font-semibold text-muted-foreground">{item.old.header}</h3>
                            <p className="text-lg font-headline text-gray-800 mt-2">{item.old.text}</p>
                            <p className="mt-2 text-muted-foreground">{item.old.description}</p>
                        </div>
                         <div className="bg-primary/5 p-6">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                {item.new.header}
                            </h3>
                            <p className="text-lg font-headline text-gray-800 mt-2">{item.new.text}</p>
                            <p className="mt-2 text-muted-foreground">{item.new.description}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

      </div>
    </section>
  );
}
