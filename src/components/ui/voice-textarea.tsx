import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  id?: string;
}

export const VoiceTextarea = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  minHeight = "min-h-[100px]",
  id,
  ...props
}: VoiceTextareaProps) => {
  const [appendMode, setAppendMode] = useState(true);

  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onResult: (text) => {
      if (appendMode && value.trim()) {
        // Append to existing text with proper spacing
        const newValue = value.trim() + " " + text;
        onChange(newValue);
      } else {
        // Replace existing text
        onChange(text);
      }
    },
    continuous: false,
    language: 'en-US'
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  if (!isSupported) {
    // Fallback to regular textarea if voice not supported
    return (
      <Textarea
        id={id}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={cn(minHeight, className)}
        disabled={disabled}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <Textarea
        id={id}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={cn(minHeight, "pr-12", className)}
        disabled={disabled}
        {...props}
      />
      
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={toggleListening}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            isListening && "bg-red-500 hover:bg-red-600 text-white"
          )}
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        
        {value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAppendMode(!appendMode)}
            className="h-6 w-8 p-0 text-xs"
            title={appendMode ? "Click to replace text" : "Click to append text"}
          >
            {appendMode ? "+" : "↻"}
          </Button>
        )}
      </div>
      
      {isListening && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-600 animate-pulse">
          🎤 Listening... speak now
        </div>
      )}
    </div>
  );
};