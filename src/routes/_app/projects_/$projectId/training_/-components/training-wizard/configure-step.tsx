import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ConfigureMode } from './types'

const augmentations = [
  'Random flip',
  'Random crop',
  'Color jitter',
  'Rotation ±15°',
  'Mixup',
  'Random erasing',
] as const

type ConfigureStepProps = {
  mode: ConfigureMode
  setMode: (value: ConfigureMode) => void
  epochs: number
  setEpochs: (value: number) => void
  batchSize: number
  setBatchSize: (value: number) => void
  learningRate: 'auto' | 'low' | 'high'
  setLearningRate: (value: 'auto' | 'low' | 'high') => void
  selectedAugmentations: string[]
  toggleAugmentation: (value: string) => void
  earlyStopping: boolean
  setEarlyStopping: (value: boolean) => void
  optimizer: string
  setOptimizer: (value: string) => void
  weightDecay: string
  setWeightDecay: (value: string) => void
  warmupSteps: number
  setWarmupSteps: (value: number) => void
  mixedPrecision: string
  setMixedPrecision: (value: string) => void
  yaml: string
}

export function ConfigureStep(props: ConfigureStepProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Configure training</h2>
        <Tabs
          value={props.mode}
          onValueChange={(value) => props.setMode(value as ConfigureMode)}
        >
          <TabsList>
            {(['simple', 'advanced', 'yaml'] as const).map((value) => (
              <TabsTrigger key={value} value={value} className="capitalize">
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {props.mode === 'yaml' ? (
        <div className="mt-6">
          <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {props.yaml}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Generated from your current settings. Switch to Simple or Advanced
            to edit.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          <div>
            <div className="flex justify-between text-sm font-medium">
              <span>Epochs</span>
              <span className="text-indigo-600">{props.epochs}</span>
            </div>
            <Slider
              className="mt-3"
              min={1}
              max={100}
              step={1}
              value={[props.epochs]}
              onValueChange={([value]) => props.setEpochs(value)}
              aria-label="Epochs"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              More epochs may improve accuracy but increase cost.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="block leading-normal font-normal">
              <span className="text-sm font-medium">Batch size</span>
              <Select
                value={String(props.batchSize)}
                onValueChange={(value) => props.setBatchSize(Number(value))}
              >
                <SelectTrigger
                  className="mt-1.5 w-full"
                  aria-label="Batch size"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[16, 32, 64, 128].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                      {value === 32 ? ' (recommended)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="block leading-normal font-normal">
              <span className="text-sm font-medium">Learning rate</span>
              <Select
                value={props.learningRate}
                onValueChange={(value) =>
                  props.setLearningRate(value as 'auto' | 'low' | 'high')
                }
              >
                <SelectTrigger
                  className="mt-1.5 w-full"
                  aria-label="Learning rate"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (1e-3, cosine)</SelectItem>
                  <SelectItem value="low">Low (1e-4)</SelectItem>
                  <SelectItem value="high">High (1e-2)</SelectItem>
                </SelectContent>
              </Select>
            </Label>
          </div>
          <div>
            <span className="text-sm font-medium">Data augmentation</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {augmentations.map((item) => (
                <Label
                  key={item}
                  className="flex items-center justify-between rounded-md p-2.5 leading-normal font-normal ring-1 ring-slate-200"
                >
                  <span className="text-sm">{item}</span>
                  <Switch
                    checked={props.selectedAugmentations.includes(item)}
                    onCheckedChange={() => props.toggleAugmentation(item)}
                    aria-label={item}
                  />
                </Label>
              ))}
            </div>
          </div>
          <Label className="flex items-center gap-2 text-sm leading-normal font-normal">
            <Checkbox
              checked={props.earlyStopping}
              onCheckedChange={(value) =>
                props.setEarlyStopping(value === true)
              }
            />
            Enable early stopping (patience 5)
          </Label>
          {props.mode === 'advanced' && (
            <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
              <Label className="block leading-normal font-normal">
                <span className="text-sm font-medium">Optimizer</span>
                <Select
                  value={props.optimizer}
                  onValueChange={props.setOptimizer}
                >
                  <SelectTrigger
                    className="mt-1.5 w-full"
                    aria-label="Optimizer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['AdamW', 'SGD + momentum', 'Lion'].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label className="block leading-normal font-normal">
                <span className="text-sm font-medium">Weight decay</span>
                <Input
                  className="mt-1.5"
                  value={props.weightDecay}
                  onChange={(event) => props.setWeightDecay(event.target.value)}
                />
              </Label>
              <Label className="block leading-normal font-normal">
                <span className="text-sm font-medium">Warmup steps</span>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={0}
                  value={props.warmupSteps}
                  onChange={(event) =>
                    props.setWarmupSteps(Number(event.target.value))
                  }
                />
              </Label>
              <Label className="block leading-normal font-normal">
                <span className="text-sm font-medium">Mixed precision</span>
                <Select
                  value={props.mixedPrecision}
                  onValueChange={props.setMixedPrecision}
                >
                  <SelectTrigger
                    className="mt-1.5 w-full"
                    aria-label="Mixed precision"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bf16">bf16 (recommended)</SelectItem>
                    <SelectItem value="fp16">fp16</SelectItem>
                    <SelectItem value="fp32">fp32</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
