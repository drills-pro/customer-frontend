import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Slider,
  SliderBar,
  SliderDragger,
  SliderMark,
} from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TrainingScheduler } from '@/features/dashboard/data'
import { formatLearningRate } from '@/features/training/format'

const augmentations = [
  'Random flip',
  'Random crop',
  'Color jitter',
  'Rotation ±15°',
  'Mixup',
  'Random erasing',
] as const
const batchSizeTicks = [4, 8, 16, 32, 64, 128] as const
const batchSizeMin = 1
const batchSizeMax = 128
const learningRateTicks = ['1e-5', '1e-4', '1e-3', '1e-2', '1e-1']

type ConfigureStepProps = {
  epochs: number
  setEpochs: (value: number) => void
  batchSize: number
  setBatchSize: (value: number) => void
  learningRate: number
  setLearningRate: (value: number) => void
  scheduler: TrainingScheduler
  setScheduler: (value: TrainingScheduler) => void
  selectedAugmentations: string[]
  toggleAugmentation: (value: string) => void
  earlyStopping: boolean
  setEarlyStopping: (value: boolean) => void
}

export function ConfigureStep(props: ConfigureStepProps) {
  const learningRateExponent = Math.log10(props.learningRate) + 5

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Configure training
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune the run's hyperparameters and augmentation.
        </p>
      </div>
      <div className="mt-8 grid gap-6">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <Label className="font-semibold">Epochs</Label>
            <span className="text-sm font-semibold text-primary">
              {props.epochs}
            </span>
          </div>
          <Slider
            className="mt-3"
            min={1}
            max={100}
            step={1}
            value={[props.epochs]}
            onValueChange={([value]) => props.setEpochs(value)}
          >
            <SliderBar>
              <SliderMark />
            </SliderBar>
            <SliderDragger label="Epochs" />
          </Slider>
          <p className="mt-2 text-xs text-muted-foreground">
            More epochs may improve accuracy but increase cost.
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <Label className="font-semibold">Learning rate</Label>
            <span className="text-sm font-semibold text-primary">
              {formatLearningRate(props.learningRate)}
            </span>
          </div>
          <Slider
            className="mt-3"
            min={0}
            max={4}
            step={0.01}
            value={[learningRateExponent]}
            onValueChange={([value]) =>
              props.setLearningRate(Math.pow(10, -5 + value))
            }
          >
            <SliderBar>
              <SliderMark />
            </SliderBar>
            <SliderDragger
              label="Learning rate"
              valueText={formatLearningRate(props.learningRate)}
            />
          </Slider>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            {learningRateTicks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <ToggleGroup
            type="single"
            value={props.scheduler}
            onValueChange={(value) => {
              if (value) props.setScheduler(value as TrainingScheduler)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Learning rate schedule"
            className="mt-2"
          >
            {(['cosine', 'linear', 'constant'] as const).map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={`${value} schedule`}
                className="capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <Label className="font-semibold">Batch size</Label>
            <span className="text-sm font-semibold text-primary">
              {props.batchSize}
            </span>
          </div>
          <Slider
            className="mt-3"
            min={batchSizeMin}
            max={batchSizeMax}
            step={1}
            value={[props.batchSize]}
            onValueChange={([value]) => props.setBatchSize(value)}
          >
            <SliderBar>
              <SliderMark />
            </SliderBar>
            <SliderDragger
              label="Batch size"
              valueText={String(props.batchSize)}
            />
          </Slider>
          <div className="relative mt-2 h-4 text-[11px] text-muted-foreground">
            {batchSizeTicks.map((value) => {
              const percent =
                ((value - batchSizeMin) / (batchSizeMax - batchSizeMin)) * 100
              const translate =
                value === batchSizeMax
                  ? '-translate-x-full'
                  : '-translate-x-1/2'
              return (
                <span
                  key={value}
                  className={`absolute ${translate}`}
                  style={{ left: `${percent}%` }}
                >
                  {value}
                </span>
              )
            })}
          </div>
        </div>

        <Label className="font-semibold">Data augmentation</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {augmentations.map((item) => (
            <Label
              key={item}
              className="flex items-center justify-between rounded-lg border p-2.5 leading-normal font-normal"
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

        <Label className="flex items-center gap-2.5 text-sm leading-normal font-normal">
          <Checkbox
            checked={props.earlyStopping}
            onCheckedChange={(value) => props.setEarlyStopping(value === true)}
          />
          Enable early stopping (patience 5)
        </Label>
      </div>
    </section>
  )
}
