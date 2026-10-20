import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { Network } from 'lucide-react'

import type { ApiArchitecture } from '@/features/catalog/api'

export function ModelStep({
  architectures,
  architectureId,
  setArchitectureId,
}: {
  architectures: ApiArchitecture[]
  architectureId: string
  setArchitectureId: (id: string) => void
}) {
  const selected =
    architectures.find((item) => item.id === architectureId) ?? architectures[0]
  const metadata = selected.meta.split(' · ')

  return (
    <section>
      <Box>
        <Heading
          as="h2"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          Choose a model
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Pick an architecture to fine-tune, or start from scratch.
        </Text>
      </Box>
      <Flex
        mt="6"
        align="center"
        gap="4"
        rounded="l3"
        borderWidth="1px"
        borderColor="brand"
        bg="brand.subtle"
        p="5"
      >
        <Center
          boxSize="14"
          flexShrink={0}
          rounded="l3"
          bg="brand"
          color="on-brand"
        >
          <Network size={24} />
        </Center>
        <Box minW="0">
          <Heading as="h3" fontSize="md" fontWeight="semibold">
            {selected.name}
          </Heading>
          <Text textStyle="body-sm" color="fg.muted" lineHeight="relaxed">
            {selected.description}
          </Text>
          <Flex
            mt="1"
            wrap="wrap"
            columnGap="3"
            rowGap="1"
            fontSize="xs"
            fontWeight="semibold"
            color="brand-text"
          >
            {metadata.map((value, index) => (
              <Flex as="span" key={value} align="center" gap="3">
                {index > 0 && (
                  <Box as="span" boxSize="1" rounded="full" bg="currentColor" />
                )}
                {value}
              </Flex>
            ))}
          </Flex>
        </Box>
      </Flex>
      <SimpleGrid mt="5" columns={{ base: 2, sm: 3 }} gap="3">
        {architectures.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setArchitectureId(item.id)}
            aria-pressed={architectureId === item.id}
            minW="0"
            flexDirection="column"
            justifyContent="flex-start"
            gap="2.5"
            rounded="l3"
            py="5"
            textAlign="center"
            css={{
              '&[aria-pressed=true] [data-model-icon]': {
                bg: 'brand',
                color: 'on-brand',
              },
            }}
          >
            <Center
              data-model-icon
              boxSize="10"
              rounded="l2"
              bg="brand.subtle"
              color="brand.fg"
            >
              <Network size={20} />
            </Center>
            <Text
              maxW="full"
              whiteSpace="normal"
              textStyle="body-sm"
              fontWeight="semibold"
            >
              {item.name}
            </Text>
          </Button>
        ))}
      </SimpleGrid>
    </section>
  )
}
