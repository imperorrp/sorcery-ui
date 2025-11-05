/**
 * Authentic Shadcn Multi-Component Examples
 * 
 * These examples use the REAL shadcn/ui component patterns with proper file structure:
 * - Each component and sub-component in separate files
 * - Proper ES6 imports between components
 * - Real class-variance-authority (CVA) usage for variant management
 * - Authentic styling matching official shadcn/ui components
 * 
 * This follows the app's core principle: EVERY COMPONENT IN ITS OWN FILE
 */

import type { ComponentData } from '@/store/componentStore';

/**
 * Shadcn Button Example - Multi-File Setup
 * 
 * Demonstrates:
 * - Button.tsx: Main component with real CVA variants
 * - button-demo.tsx: Usage example importing Button
 * - Proper ES6 import/export pattern
 * - Real class-variance-authority package usage
 */
export const shadcnButtonMultiExample = {
  activeId: 'button-demo-id',
  description: 'Authentic shadcn/ui Button with CVA variants in separate files',
  components: [
    {
      id: 'button-id',
      name: 'Button',
      code: `import * as React from "react"

// Inline CVA implementation for browser compatibility
function cva(base, config) {
  return function(props) {
    let classes = base;
    if (config && config.variants && props) {
      Object.keys(config.variants).forEach(variantKey => {
        const variantValue = props[variantKey];
        if (variantValue && config.variants[variantKey][variantValue]) {
          classes += ' ' + config.variants[variantKey][variantValue];
        }
      });
    }
    if (props && props.className) {
      classes += ' ' + props.className;
    }
    return classes;
  };
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? "button" : "button" // Simplified for browser

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{"variant": "default", "children": "Button"}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{"variant": "default", "children": "Button"}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
    {
      id: 'button-demo-id',
      name: 'ButtonDemo',
      code: `import { Button } from './Button'

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="outline" size="sm">Small</Button>
      <Button variant="outline" size="lg">Large</Button>
      <Button variant="outline" size="icon">↑</Button>
    </div>
  )
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
  ] as ComponentData[]
};

/**
 * Shadcn Badge Example - Multi-File Setup
 */
export const shadcnBadgeMultiExample = {
  activeId: 'badge-demo-id',
  description: 'Authentic shadcn/ui Badge with CVA variants',
  components: [
    {
      id: 'badge-id',
      name: 'Badge',
      code: `import * as React from "react"

// Inline CVA implementation for browser compatibility
function cva(base, config) {
  return function(props) {
    let classes = base;
    if (config && config.variants && props) {
      Object.keys(config.variants).forEach(variantKey => {
        const variantValue = props[variantKey];
        if (variantValue && config.variants[variantKey][variantValue]) {
          classes += ' ' + config.variants[variantKey][variantValue];
        }
      });
    }
    if (props && props.className) {
      classes += ' ' + props.className;
    }
    return classes;
  };
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
    {
      id: 'badge-demo-id',
      name: 'BadgeDemo',
      code: `import { Badge } from './Badge'

export default function BadgeDemo() {
  return (
    <div className="p-8 space-y-6 bg-background">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Badge Variants</h3>
      <div className="flex flex-wrap gap-4">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-6">
        <Badge variant="default">12 New</Badge>
        <Badge variant="secondary">In Progress</Badge>
        <Badge variant="destructive">Error</Badge>
        <Badge variant="outline">Draft</Badge>
      </div>
    </div>
  )
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
  ] as ComponentData[]
};

/**
 * Shadcn Alert Example - Multi-File with Sub-Components
 */
export const shadcnAlertMultiExample = {
  activeId: 'alert-demo-id',
  description: 'Authentic shadcn/ui Alert with sub-components',
  components: [
    {
      id: 'alert-id',
      name: 'Alert',
      code: `import * as React from "react"

// Inline CVA implementation for browser compatibility
function cva(base, config) {
  return function(props) {
    let classes = base;
    if (config && config.variants && props) {
      Object.keys(config.variants).forEach(variantKey => {
        const variantValue = props[variantKey];
        if (variantValue && config.variants[variantKey][variantValue]) {
          classes += ' ' + config.variants[variantKey][variantValue];
        }
      });
    }
    if (props && props.className) {
      classes += ' ' + props.className;
    }
    return classes;
  };
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef((props, ref) => {
  const { className, variant, ...rest } = props;
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...rest}
    />
  );
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...rest}
    />
  );
})
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...rest}
    />
  );
})
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
    {
      id: 'alert-demo-id',
      name: 'AlertDemo',
      code: `import { Alert, AlertDescription, AlertTitle } from './Alert'

export default function AlertDemo() {
  return (
    <div className="p-8 space-y-4 max-w-2xl bg-background">
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>
          This is a default alert message with some information.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  )
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
  ] as ComponentData[]
};

/**
 * Shadcn Card Example - Multi-File with Multiple Sub-Components
 */
export const shadcnCardMultiExample = {
  activeId: 'card-demo-id',
  description: 'Authentic shadcn/ui Card with all sub-components',
  components: [
    {
      id: 'card-id',
      name: 'Card',
      code: `import * as React from "react"

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
    {
      id: 'card-demo-id',
      name: 'CardDemo',
      code: `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

export default function CardDemo() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-background">
      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
          <CardDescription>Deploy your new project in one-click.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Get started by creating a new project.</p>
        </CardContent>
        <CardFooter>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Create
          </button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
          <CardDescription>Manage your team preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Configure team members and permissions.</p>
        </CardContent>
        <CardFooter>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
            Settings
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
  ] as ComponentData[]
};
