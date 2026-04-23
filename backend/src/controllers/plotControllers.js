import PlotMap from '../models/PlotMap.js';

export const getPlotsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const plots = await PlotMap.find({ projectId: Number(projectId) });
    res.status(200).json(plots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plots', error: error.message });
  }
};
