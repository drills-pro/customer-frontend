import { Box, Grid, Text } from '@chakra-ui/react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AccountNav } from './-components';

export const Route = createFileRoute('/_app/account')({
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" flex="1" p={{ base: '4', sm: '6' }}>
      <Text mb="4" textStyle="body-sm" color="fg.muted">
        Account settings
      </Text>
      <Grid minW="0" gap="6" templateColumns={{ lg: '200px minmax(0, 1fr)' }}>
        <AccountNav />
        <Grid minW="0" maxW="4xl" alignContent="start" gap="5">
          <Outlet />
        </Grid>
      </Grid>
    </Box>
  );
}
