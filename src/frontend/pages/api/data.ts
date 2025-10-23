// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import type { NextApiRequest, NextApiResponse } from 'next';
import InstrumentationMiddleware from '../../utils/telemetry/InstrumentationMiddleware';
import AdGateway from '../../gateways/rpc/Ad.gateway';
import { Ad, Empty } from '../../protos/demo';

type TResponse = Ad[] | Empty | { error: string };

const handler = async ({ method, query }: NextApiRequest, res: NextApiResponse<TResponse>) => {
  try {
    switch (method) {
      case 'GET': {
        // Validate query parameter
        if (!query.contextKeys) {
          return res.status(400).json({ error: 'contextKeys parameter is required' });
        }

        // Parse and validate context keys
        const contextKeys = Array.isArray(query.contextKeys) 
          ? query.contextKeys 
          : query.contextKeys.split(',').filter(key => key.trim().length > 0);

        if (contextKeys.length === 0) {
          return res.status(400).json({ error: 'At least one valid context key is required' });
        }

        // Get ads with error handling
        try {
          const { ads: adList } = await AdGateway.listAds(contextKeys);
          return res.status(200).json(adList || []);
        } catch (error) {
          console.error('[AdGateway] Failed to fetch ads:', error);
          return res.status(500).json({ error: 'Failed to fetch ads' });
        }
      }

      default: {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    }
  } catch (error) {
    console.error('[data-api] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default InstrumentationMiddleware(handler);