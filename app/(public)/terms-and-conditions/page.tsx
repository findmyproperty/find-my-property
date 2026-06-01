import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
    const { siteName } = await getBranding();
    return {
        title: "Terms & Conditions",
        description: `Terms and Conditions for using ${siteName}. Read our policies on property information, user responsibilities, liability, and more.`,
        openGraph: {
            title: `Terms & Conditions | ${siteName}`,
            description: `Review the Terms & Conditions for ${siteName}. Last updated 5th March 2025.`,
        },
        alternates: {
            canonical: "/terms-and-conditions",
        },
    };
}

export default async function TermsAndConditionsPage() {
    return (
        <main className="pb-20 pt-24">
            <div className="container mx-auto max-w-3xl px-4">
                <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2 text-muted-foreground">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to home
                    </Link>
                </Button>

                <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Terms &amp; Conditions
                </h1>

                <p className="mt-2 mb-6 text-sm italic text-muted-foreground">Last Updated: 5th March 2025</p>

                <p className="text-muted-foreground leading-relaxed">
                    Welcome to Find My Property. By accessing or using this website, you agree to comply with these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of the website.
                </p>

                <section className="mt-8 mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        By accessing or using our services, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. Website Purpose</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The website provides information regarding real estate properties, projects, developers, agents, investment opportunities, and related services. Information displayed is for informational purposes only and does not constitute legal, financial, or investment advice.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. User Eligibility</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Users must be at least 18 years of age and legally capable of entering into binding agreements.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. Property Information Disclaimer</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        While we strive to ensure accuracy, we do not guarantee that property descriptions, pricing, availability, approvals, measurements, photographs, or other details are complete, accurate, or up-to-date.
                    </p>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                        Users are advised to independently verify all information before making any property-related decisions.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. No Brokerage Guarantee</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Unless specifically stated, the website does not act as a real estate broker, agent, legal advisor, or financial consultant. Transactions entered into between users and third parties are solely their responsibility.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. User Responsibilities</h2>
                    <p className="text-muted-foreground leading-relaxed">Users agree not to:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Provide false or misleading information.</li>
                        <li>Upload unlawful, fraudulent, or offensive content.</li>
                        <li>Violate any applicable laws or regulations.</li>
                        <li>Interfere with website functionality or security.</li>
                        <li>Attempt unauthorized access to website systems.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        All website content, including text, graphics, logos, images, design elements, software, and trademarks, is owned by or licensed to Find My Property and is protected under applicable intellectual property laws.
                    </p>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                        Unauthorized reproduction or distribution is prohibited.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">8. Third-Party Links</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The website may contain links to third-party websites. We do not control or endorse such websites and are not responsible for their content, privacy practices, or services.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To the maximum extent permitted by law, Find My Property shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                        <li>Use of the website.</li>
                        <li>Property transactions.</li>
                        <li>Errors or omissions in listings.</li>
                        <li>Service interruptions.</li>
                        <li>Third-party actions.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">10. Indemnification</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Users agree to indemnify and hold harmless Find My Property, its directors, employees, affiliates, and partners from any claims, liabilities, damages, or expenses arising from misuse of the website or violation of these Terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">11. Privacy</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Your use of the website is also governed by our Privacy Policy.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">12. Modifications</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We reserve the right to modify these Terms and Conditions at any time without prior notice. Continued use of the website constitutes acceptance of the revised terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">13. Governing Law</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Chennai, Tamil Nadu.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-3">14. Contact Information</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        For any questions regarding these Terms and Conditions, please contact:
                    </p>
                    <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
                        <p className="font-semibold text-foreground">Find My Property</p>
                        <p className="mt-2">
                            Email:{" "}
                            <a
                                href="mailto:findmypropertysrealtysolution@gmail.com"
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                findmypropertysrealtysolution@gmail.com
                            </a>
                        </p>
                        <p>Phone:</p>
                        <p>Address:</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
