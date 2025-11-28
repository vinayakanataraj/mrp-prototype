
import React from 'react';
import { ChevronDown, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  endOfWeek,
  addDays 
} from 'date-fns';

// Helper for class names
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Local date helpers
function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

// --- Input ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
);

// --- Textarea ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
);
Textarea.displayName = "Textarea";

// --- Select ---
export function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className 
}: { 
  value?: string; 
  onChange: (value: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder?: string; 
  className?: string; 
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(o => o.value === value);
  
  const handleOpen = () => {
    if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
        });
    }
    setIsOpen(!isOpen);
  };

  // Close on scroll to prevent detached popup
  React.useEffect(() => {
      const handleScroll = () => {
          if(isOpen) setIsOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("block truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className="fixed z-50 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
            style={{ 
                top: coords.top, 
                left: coords.left, 
                width: coords.width,
                maxHeight: '15rem' 
            }}
          >
            <div className="p-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Combobox ---
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select or type...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => !value || opt.toLowerCase().includes(value.toLowerCase()));

  // Check if current value exists in options (case insensitive)
  const exactMatch = options.some(opt => opt.toLowerCase() === value.toLowerCase());

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
             onChange(e.target.value);
             setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') setOpen(false);
          }}
          placeholder={placeholder}
          className="pr-8"
        />
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className="absolute right-0 top-0 h-full w-8 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
            tabIndex={-1}
        >
             <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border text-popover-foreground shadow-md rounded-md max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95">
            <div className="p-1">
                {/* Create Option */}
                {value && !exactMatch && (
                    <div
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none bg-accent/50 text-accent-foreground hover:bg-accent mb-1"
                        onClick={() => {
                            // Value is already set by Input onChange, just close
                            setOpen(false);
                        }}
                    >
                        <span className="font-semibold mr-1">Create</span> "{value}"
                    </div>
                )}
                
                {filteredOptions.length === 0 && !value && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Type to create...</div>
                )}

                {filteredOptions.map((opt) => (
                    <div
                        key={opt}
                        className={cn(
                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            opt === value && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => {
                            onChange(opt);
                            setOpen(false);
                        }}
                    >
                        {opt}
                        {opt === value && <Check className="ml-auto h-4 w-4" />}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

// --- Popover ---
export function Popover({ children, open, onOpenChange, className, style, ...props }: { children?: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void } & React.HTMLAttributes<HTMLDivElement>) {
  const [isOpenState, setIsOpenState] = React.useState(false);
  const isOpen = open !== undefined ? open : isOpenState;
  const setOpen = onOpenChange || setIsOpenState;

  const triggerRef = React.useRef<HTMLDivElement>(null);
  
  const toggle = () => setOpen(!isOpen);
  const close = () => setOpen(false);

  const elements = React.Children.toArray(children);
  const trigger = elements.find(child => React.isValidElement(child) && child.type === PopoverTrigger);
  const content = elements.find(child => React.isValidElement(child) && child.type === PopoverContent);

  return (
    <div className={cn("relative inline-block", className)} style={style} ref={triggerRef} {...props}>
      <div onClick={toggle}>{trigger}</div>
      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={close}></div>
            <div className="absolute left-0 top-full mt-2 z-50 w-max">
                {content}
            </div>
        </>
      )}
    </div>
  );
}

export function PopoverTrigger({ children, asChild }: { children?: React.ReactNode, asChild?: boolean }) {
  return <>{children}</>;
}

export function PopoverContent({ children, className, align }: { children?: React.ReactNode, className?: string, align?: "start" | "center" | "end" }) {
  const alignStyle = align === 'end' ? { right: 0 } : { left: 0 };
  return <div className={className} style={{ position: 'absolute', ...alignStyle }}>{children}</div>;
}

// --- Calendar ---
export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
}: {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  // Use addMonths with negative value instead of subMonths
  const handlePrevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between pt-1 pb-4 px-1">
        <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none shadow-none" onClick={handlePrevMonth}>
           <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
            {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none shadow-none" onClick={handleNextMonth}>
           <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-muted-foreground font-normal text-[0.8rem] w-8">
                {day}
            </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {daysInMonth.map((day, idx) => {
            const isSelected = selected ? isSameDay(day, selected) : false;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
                <button
                    key={idx}
                    onClick={() => onSelect && onSelect(day)}
                    disabled={!isCurrentMonth}
                    className={cn(
                        "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                        !isCurrentMonth && "text-muted-foreground opacity-50 invisible", 
                        isSelected 
                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                            : "hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <time dateTime={format(day, 'yyyy-MM-dd')}>
                        {format(day, 'd')}
                    </time>
                </button>
            );
        })}
      </div>
    </div>
  );
}

// --- Card ---
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

// --- Badge ---
export function Badge({ className, variant = 'default', children }: { className?: string, variant?: 'default' | 'secondary' | 'destructive' | 'outline', children?: React.ReactNode }) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-border",
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)}>
      {children}
    </div>
  )
}

// --- Separator ---
export function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return <div className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)} />
}

// --- Avatar ---
export function Avatar({ initials, className, ...props }: { initials: string; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center text-sm font-medium", className)} {...props}>
      {initials}
    </div>
  )
}

// --- Dropdown Menu Simulator ---
export function DropdownMock({ 
    children, 
    trigger, 
    isOpen, 
    onClose,
    align = 'end',
    side = 'bottom',
    className
}: { 
    children?: React.ReactNode, 
    trigger: React.ReactNode, 
    isOpen: boolean, 
    onClose: () => void,
    align?: 'start' | 'end',
    side?: 'top' | 'bottom',
    className?: string
}) {
    return (
        <div className={cn("relative inline-block text-left", className)}>
            {trigger}
            {isOpen && (
                 <>
                 <div className="fixed inset-0 z-40" onClick={onClose}></div>
                 <div className={cn(
                     "absolute z-50 w-56 rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 border border-border",
                     align === 'end' ? "right-0" : "left-0",
                     side === 'bottom' ? "top-full mt-2" : "bottom-full mb-2",
                     side === 'bottom' && align === 'end' && "origin-top-right",
                     side === 'bottom' && align === 'start' && "origin-top-left",
                     side === 'top' && align === 'end' && "origin-bottom-right",
                     side === 'top' && align === 'start' && "origin-bottom-left"
                 )}>
                     <div className="py-1">
                        {children}
                     </div>
                 </div>
                 </>
            )}
        </div>
    )
}

// --- Progress ---
export function Progress({ value, className }: { value: number, className?: string }) {
  return (
    <div className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}

// --- Table ---
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"
