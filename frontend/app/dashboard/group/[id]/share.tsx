"use client";

import { useState, useEffect, useRef } from "react";
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaTelegram } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Users } from "lucide-react";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


interface Member {
    clerkId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
}

interface Group {
    _id: string;
    name: string;
    code: string;
    source: string;
    destination: string;
    members: Member[];
    startTime: string;
    reachTime: string;
    isActive: boolean;
    createdBy: string;
    distanceThreshold?: number;
}
interface ShareComponent {
    group: Group;
}
export default function ShareComponent({ group }: ShareComponent) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [qrCodeLoading, setQrCodeLoading] = useState(true);
    const [qrCodeError, setQrCodeError] = useState(false);
    const [shareLoading, setShareLoading] = useState<string | null>(null);
    const mounted = useRef(true);
    const { toast } = useToast();
    const resetInviteDialogState = () => {
        setQrCodeError(false);
        setShareLoading(null);
    };

    useEffect(() => {
        if (inviteDialogOpen && mounted.current) {
            setQrCodeLoading(true);
            const timer = setTimeout(() => {
                if (mounted.current) {
                    setQrCodeLoading(false);
                }
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [inviteDialogOpen]);

    const generateShareUrl = (platform: string) => {
        const groupName = group?.name || "our ride";
        const joinUrl = `${window.location.origin}/join/${group?.code}`;

        // Create different formats based on platform
        const shareText = encodeURIComponent(`Join my group "${groupName}" on RiderConnect!`);
        const shareUrl = encodeURIComponent(joinUrl);

        switch (platform) {
            case 'whatsapp':
                return `https://wa.me/?text=${shareText}%0A${shareUrl}`;
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
            case 'linkedin':
                return `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
            case 'telegram':
                return `https://telegram.me/share/url?url=${shareUrl}&text=${shareText}`;
            default:
                return joinUrl;
        }
    };

    const handleShare = (platform: string) => {
        setShareLoading(platform);
        try {
            const shareUrl = generateShareUrl(platform);
            const windowFeatures = 'width=550,height=450,scrollbars=yes,resizable=yes';

            // For all platforms, use a popup
            const opened = window.open(shareUrl, '_blank', windowFeatures);

            if (!opened) {
                throw new Error('Popup was blocked');
            }

            // Clear loading state after a short delay
            setTimeout(() => setShareLoading(null), 500);
        } catch (error) {
            toast({
                title: 'Share Error',
                description: 'Failed to open share dialog. Please try copying the link instead.',
                variant: 'destructive',
            });
            setShareLoading(null);
        }
    };
    const copyToClipboard = (text: string, successMessage: string) => {
        navigator.clipboard.writeText(text).then(
            () => toast({ title: "Copied!", description: successMessage }),
            () =>
                toast({
                    title: "Error",
                    description: "Failed to copy",
                    variant: "destructive",
                })
        );
    };

    return (
        <div className="flex items-center gap-2">
            <Dialog
                open={inviteDialogOpen}
                onOpenChange={(open) => {
                    setInviteDialogOpen(open);
                    if (open) {
                        // Reset states when opening dialog
                        setQrCodeLoading(true);
                        setQrCodeError(false);
                        // Set a timeout to hide loading after QR code is likely ready
                        setTimeout(() => setQrCodeLoading(false), 800);
                    } else {
                        resetInviteDialogState();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="relative group hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Invite</span>
                        <motion.div
                            className="absolute inset-0 rounded-md bg-primary/10"
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-[500px] h-auto max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-6 gap-2 sm:gap-4">
                    <DialogHeader>
                        <DialogTitle>Invite People to {group.name}</DialogTitle>
                        <DialogDescription>
                            Invite others by scanning the QR code or sharing the invite code below via your preferred communication channels.
                        </DialogDescription>
                    </DialogHeader>

                    {/* <div className="border-b border-muted/30 mb-2 pb-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Share the invite link or code with your friends.
                  </p>
                </div> */}
                    <div className="grid gap-2 sm:gap-4 py-2 sm:py-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-md relative">
                                {qrCodeLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10 backdrop-blur-sm">
                                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                )}

                                {qrCodeError ? (
                                    <div className="h-[150px] w-[150px] flex flex-col items-center justify-center bg-gray-100 rounded-md p-4 text-center">
                                        <div className="text-destructive mb-2">QR Code Error</div>
                                        <p className="text-xs text-muted-foreground mb-2">Failed to generate QR code</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setQrCodeError(false);
                                                setQrCodeLoading(true);
                                            }}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Use the QRCode component with correct props */}
                                        <QRCodeSVG
                                            value={`${window.location.origin}/join/${group.code}`}
                                            size={120}
                                            className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-md"
                                            level="H"
                                            includeMargin={false}
                                        />
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(
                                                    `${window.location.origin}/join/${group.code}`,
                                                    "QR Code link copied!"
                                                )}
                                                className="text-xs hover:bg-white/20"
                                            >
                                                Copy Link
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Invite Code Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="space-y-2"
                        >
                            <Label>Invite Code</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={group.code}
                                    readOnly
                                    className="bg-secondary/30 font-mono text-base sm:text-lg text-center tracking-wider"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(group.code, "Invite code copied!")}
                                    className="hover:bg-primary hover:text-primary-foreground transition-all transform hover:scale-110 active:scale-95"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>

                        {/* Social Share Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="space-y-2"
                        >
                            <Label>Share via</Label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                                {[
                                    { platform: 'whatsapp', icon: FaWhatsapp, color: '#25D366', label: 'WhatsApp' },
                                    { platform: 'facebook', icon: FaFacebook, color: '#1877F2', label: 'Facebook' },
                                    { platform: 'twitter', icon: FaTwitter, color: '#1DA1F2', label: 'Twitter' },
                                    { platform: 'linkedin', icon: FaLinkedin, color: '#0A66C2', label: 'LinkedIn' },
                                    { platform: 'telegram', icon: FaTelegram, color: '#0088cc', label: 'Telegram' }
                                ].map(({ platform, icon: Icon, color, label }) => (
                                    <Button
                                        key={platform}
                                        variant="outline"
                                        size="icon"
                                        disabled={shareLoading !== null}
                                        style={{
                                            backgroundColor: shareLoading === platform ? 'transparent' : undefined
                                        }}
                                        className={cn(
                                            "transition-all duration-300 relative group",
                                            "hover:scale-105 active:scale-95",
                                            "hover:text-white focus:text-white focus:ring-2 focus:ring-offset-1",
                                            "overflow-hidden",
                                            {
                                                "cursor-wait opacity-70": shareLoading === platform,
                                                "hover:bg-[#25D366] hover:border-[#25D366]": platform === 'whatsapp',
                                                "hover:bg-[#1877F2] hover:border-[#1877F2]": platform === 'facebook',
                                                "hover:bg-[#1DA1F2] hover:border-[#1DA1F2]": platform === 'twitter',
                                                "hover:bg-[#0A66C2] hover:border-[#0A66C2]": platform === 'linkedin',
                                                "hover:bg-[#0088cc] hover:border-[#0088cc]": platform === 'telegram'
                                            }
                                        )}
                                        onClick={() => handleShare(platform)}
                                        title={`Share on ${label}`}
                                    >
                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                            {shareLoading === platform ? (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                                </div>
                                            ) : (
                                                <>
                                                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full bg-white"
                                                        aria-hidden="true"
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <span className="sr-only">Share on {label}</span>
                                    </Button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Share Link Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="space-y-2"
                        >
                            <Label>Share Link</Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={`${window.location.origin}/join/${group.code}`}
                                        readOnly
                                        className="bg-secondary/30 font-mono text-[11px] sm:text-sm pr-16 sm:pr-24 truncate"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(
                                            `${window.location.origin}/join/${group.code}`,
                                            "Share link copied!"
                                        )}
                                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-7 text-xs sm:text-sm hover:bg-secondary/50"
                                    >
                                        Copy Link
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setInviteDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )

}