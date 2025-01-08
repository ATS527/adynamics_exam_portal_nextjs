'use client'

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";

const ContactCard = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-3xl font-bold">
          Get in Touch
        </CardTitle>
        <p className="text-muted-foreground">We'd love to hear from you</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Email</label>
            </div>
            <Input placeholder="info@adynamics.in" type="email" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Phone</label>
            </div>
            <Input placeholder="+91 98765 43210" type="tel" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium">Message</label>
          </div>
          <Textarea 
            placeholder="How can we help you?" 
            className="min-h-[120px]"
          />
        </div>

        <Button className="w-full">
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContactCard;